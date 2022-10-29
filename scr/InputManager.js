class PressedKey {
    constructor(_keyCode) {
        this.keyCode = _keyCode;
        this.holdTimer = 0;
    }
    Update(_dt) { this.holdTimer += _dt; }
    GetKeyCode() { return this.keyCode; }
    JustPressed() { return this.holdTimer <= 0.05; }
}

export class InputManager {

    KeyPressEvent(_keyPressed, _codeVal) {
        if (_keyPressed) { if (!this.IsKeyHeld(_codeVal)) { this.pressedKeys.push(new PressedKey(_codeVal)); } }
        else {
            for (let i = this.pressedKeys.length - 1; i >= 0; i--) {
                if (this.pressedKeys[i].GetKeyCode() == _codeVal) { this.pressedKeys.splice(i, 1); }
            }
        }
    }

    constructor() {
        // Held Keys Buffer
        this.pressedKeys = [];
        // Key Up / Key Down Events
        document.addEventListener('keydown', (event) => { this.KeyPressEvent(true, event.code); }, false);
        document.addEventListener('keyup', (event) => { this.KeyPressEvent(false, event.code); }, false);
    }

    Update(_dt) { for (let i = 0; i < this.pressedKeys.length; i++) { this.pressedKeys[i].Update(_dt) } }

    IsKeyHeld(_codeVal) {
        for (let i = 0; i < this.pressedKeys.length; i++) { if (this.pressedKeys[i].GetKeyCode() == _codeVal) { return true; } }
        return false;
    }

    IsKeyPressed(_codeVal) {
        for (let i = 0; i < this.pressedKeys.length; i++) { if (this.pressedKeys[i].GetKeyCode() == _codeVal && this.pressedKeys[i].JustPressed()) { return true; } }
        return false;
    }

    PressingLeft() { return this.IsKeyHeld("KeyA") || this.IsKeyHeld("ArrowLeft"); }
    PressingRight() { return this.IsKeyHeld("KeyD") || this.IsKeyHeld("ArrowRight"); }
    PressingBrakes() { return this.IsKeyHeld("KeyJ") || this.IsKeyHeld("KeyZ"); }
    PressingDash() { return this.IsKeyPressed("KeyK") || this.IsKeyPressed("KeyX"); }
    PressingBoost() { return this.IsKeyHeld("KeyL") || this.IsKeyHeld("KeyC"); }

    GetHorizontalAxis() {
        let xAxis = 0;
        if (this.PressingLeft()) { xAxis--; }
        if (this.PressingRight()) { xAxis++; }
        return xAxis;
    }

}