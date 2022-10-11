export class InputManager {

    KeyPressEvent(_keyPressed, _codeVal) {
        switch (_codeVal) {
            case "ArrowLeft": this.leftArrowPressed = _keyPressed; break;
            case "ArrowRight": this.rightArrowPressed = _keyPressed; break;
        }
    }

    constructor() {

        // Horizontal Axis
        this.leftArrowPressed = false;
        this.rightArrowPressed = false;
        this.aPressed = false;
        this.dPressed = false;

        document.addEventListener('keydown', (event) => { this.KeyPressEvent(true, event.code); }, false);
        document.addEventListener('keyup', (event) => { this.KeyPressEvent(false, event.code); }, false);

    }

    PressingLeft() { return this.leftArrowPressed || this.aPressed; }
    PressingRight() { return this.rightArrowPressed || this.dPressed; }

    GetHorizontalAxis() {
        const pressingLeft = this.PressingLeft();
        const pressingRight = this.PressingRight();
        return pressingLeft == pressingRight ? 0 : pressingLeft ? -1 : 1;
    }

}