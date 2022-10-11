export class InputManager {

    KeyPressEvent(_keyPressed, _codeVal) {
        console.log(_codeVal);
        switch (_codeVal) {
            case "ArrowLeft": this.leftArrowPressed = _keyPressed; break;
            case "ArrowRight": this.rightArrowPressed = _keyPressed; break;
            case "KeyA": this.aPressed = _keyPressed; break;
            case "KeyD": this.dPressed = _keyPressed; break;
            case "KeyX": this.xPressed = _keyPressed; break;
            case "KeyE": this.ePressed = _keyPressed; break;
            case "KeyZ": this.zPressed = _keyPressed; break;
            case "KeyQ": this.qPressed = _keyPressed; break;
        }
    }

    constructor() {

        // Horizontal Axis
        this.leftArrowPressed = false;
        this.rightArrowPressed = false;
        this.aPressed = false;
        this.dPressed = false;

        // Boost Buttons
        this.xPressed = false;
        this.ePressed = false;

        // Brake Buttons
        this.zPressed = false;
        this.qPressed = false;

        document.addEventListener('keydown', (event) => { this.KeyPressEvent(true, event.code); }, false);
        document.addEventListener('keyup', (event) => { this.KeyPressEvent(false, event.code); }, false);

    }

    PressingLeft() { return this.leftArrowPressed || this.aPressed; }
    PressingRight() { return this.rightArrowPressed || this.dPressed; }
    PressingBoost() { return this.xPressed || this.ePressed; }
    PressingBrakes() { return this.zPressed || this.qPressed; }

    GetHorizontalAxis() {
        const pressingLeft = this.PressingLeft();
        const pressingRight = this.PressingRight();
        return pressingLeft == pressingRight ? 0 : pressingLeft ? -1 : 1;
    }

}