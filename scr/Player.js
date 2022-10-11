import { MoveTowards } from "./MathUtils.js";

export class Player {

    constructor() {

        // Constants
        this.accel = 600;
        this.turnAccel = 1800;
        this.friction = 2100;
        this.minSpeed = 5;
        this.maxSpeed = 300;
        this.boostSpeed = 1200;
        this.boostPeriod = 0.1;
        this.boostCooldown = 0.5;

        // Variables
        this.speed = 0;
        this.angle = 0;
        this.boostTimer = 0;

    }

    BoostActive() { return this.boostTimer > 0; }

    Update(_xInput, _boost, _brakes, _dt) {

        // Update Speed
        if (!this.BoostActive()) {
            if (_xInput == 0) {
                this.speed = MoveTowards(this.speed, 0, this.friction * _dt);
                if (Math.abs(this.speed) < this.minSpeed) { this.speed = 0; }
            }
            else {
                this.speed += (Math.sign(this.speed) != Math.sign(_xInput) ? this.turnAccel : this.accel) * _xInput * _dt;
                if (Math.abs(this.speed) > this.maxSpeed) { this.speed = this.maxSpeed * Math.sign(this.speed); }
            }
        }

        if (this.boostTimer != 0) {
            // Apply Boost Cooldown
            if (this.BoostActive() && this.boostTimer - _dt <= 0) {
                this.speed = this.maxSpeed * Math.sign(this.speed);
                this.boostTimer = -this.boostCooldown;
            }
            // Update Boost Timer / Cooldown
            else { this.boostTimer = MoveTowards(this.boostTimer, 0, _dt); }
        }
        else if (_boost && _xInput != 0) {
            // Apply Boost
            this.boostTimer = this.boostPeriod;
            this.speed = this.boostSpeed * Math.sign(_xInput);
        }

        // Update Angle
        if (this.speed != 0 || this.BoostActive()) {
            this.angle += this.speed * (_brakes && !this.BoostActive() ? 0.6 : 1) * _dt;
            while (this.angle < 0) { this.angle += 360; }
            while (this.angle >= 360) { this.angle -= 360; }
        }
    }

    GetAngle() { return this.angle; }

}