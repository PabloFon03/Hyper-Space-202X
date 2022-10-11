import { MoveTowards } from "./MathUtils.js";

export class Player {

    constructor() {

        // Constants
        this.accel = 420;
        this.turnAccel = 1500;
        this.friction = 1200;
        this.minSpeed = 5;
        this.maxSpeed = 300;

        // Variables
        this.speed = 0;
        this.angle = 0;
    }

    Update(_xInput, _dt) {
        // Update Speed
        if (_xInput == 0) {
            this.speed = MoveTowards(this.speed, 0, this.friction * _dt);
            if (Math.abs(this.speed) < this.minSpeed) { this.speed = 0; }
        }
        else {
            this.speed += (Math.sign(this.speed) != Math.sign(_xInput) ? this.turnAccel : this.accel) * _xInput * _dt;
            if (Math.abs(this.speed) > this.maxSpeed) { this.speed = this.maxSpeed * Math.sign(this.speed); }
        }

        // Update Angle
        if (this.speed != 0) {
            this.angle += this.speed * _dt;
            while (this.angle < 0) { this.angle += 360; }
            while (this.angle >= 360) { this.angle -= 360; }
        }
    }

    GetAngle() { return this.angle; }

}