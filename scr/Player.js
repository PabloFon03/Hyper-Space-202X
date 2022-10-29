import { MoveTowards } from "./MathUtils.js";

export class Player {

    constructor() {
        // Constants
        this.accel = 600;
        this.turnAccel = 1800;
        this.friction = 2100;
        this.minSpeed = 5;
        this.maxSpeed = 300;
        this.dashSpeed = 1200;
        this.dashPeriod = 0.05;
        this.dashCooldown = 0.1;

        // Variables
        this.speed = 0;
        this.angle = 0;
        this.dashTimer = 0;
    }

    DashActive() { return this.dashTimer > 0; }

    Update(_xInput, _brakes, _dash, _boost, _dt) {
        // Update Speed
        if (!this.DashActive()) {
            // Apply Friction
            if (_xInput == 0) {
                this.speed = MoveTowards(this.speed, 0, this.friction * _dt);
                if (Math.abs(this.speed) < this.minSpeed) { this.speed = 0; }
            }
            // Accelerate Angle Speed
            else {
                this.speed += (Math.sign(this.speed) != Math.sign(_xInput) ? this.turnAccel : this.accel) * _xInput * _dt;
                if (Math.abs(this.speed) > this.maxSpeed) { this.speed = this.maxSpeed * Math.sign(this.speed); }
            }
        }
        // Update Dash Timer
        if (this.dashTimer != 0) {
            // Apply Dash Cooldown
            if (this.DashActive() && this.dashTimer - _dt <= 0) {
                this.speed = this.maxSpeed * Math.sign(this.speed);
                this.dashTimer = -this.dashCooldown;
            }
            // Update Dash Timer / Cooldown
            else { this.dashTimer = MoveTowards(this.dashTimer, 0, _dt); }
        }
        // Start Dash
        else if (_dash && _xInput != 0) {
            // Apply Dash
            this.dashTimer = this.dashPeriod;
            this.speed = this.dashSpeed * Math.sign(_xInput);
        }
        // Update Angle
        if (this.speed != 0 || this.DashActive()) {
            this.angle += this.speed * (this.DashActive() ? 1 : _brakes ? 0.6 : _boost ? 1.5 : 1) * _dt;
            while (this.angle < 0) { this.angle += 360; }
            while (this.angle >= 360) { this.angle -= 360; }
        }
    }

    GetAngle() { return this.angle; }

}