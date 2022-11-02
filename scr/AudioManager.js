import * as THREE from '../node_modules/three/build/three.module.js';
import { MoveTowards } from './MathUtils.js';

class AudioClip {
    constructor(_audioListener) {
        this.clipLoaded = false;
        this.playBuffered = false;
        this.audio = new THREE.Audio(_audioListener);
    }
    AudioLoaded(_audioBuffer) {
        this.audio.setBuffer(_audioBuffer);
        this.clipLoaded = true;
        if (this.playBuffered) { this.Play(); }
    }
    Load(_fileName) {
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(_fileName, (_audioBuffer) => { this.AudioLoaded(_audioBuffer); });
    }
    Play() { if (this.clipLoaded) { this.audio.play(); } else { this.playBuffered = true; } }
    SetLoopFlag(_flagVal) { this.audio.loop = _flagVal; }
}

export class AudioManager {
    constructor(_audioListener) {
        // Volume
        this.volume = 1;
        // GUI / Controls
        this.inputDelay = 0;
        // Audio Listener Reference
        this.audioListener = _audioListener;
        // Background Music Audio
        this.BGM = new AudioClip(this.audioListener);
        this.BGM.Load("sfx/bgm.mp3");
        this.BGM.SetLoopFlag(true);
        // Coin Collect SFX
        this.CoinSound = new AudioClip(this.audioListener);
        this.CoinSound.Load("sfx/coin.wav");
        // Spike Hit SFX
        this.SpikeSound = new AudioClip(this.audioListener);
        this.SpikeSound.Load("sfx/spike.wav");
    }

    StartBGM() { if (!this.BGM.audio.isPlaying) { this.BGM.Play(); } }
    PlayCoinSFX() {
        if (this.CoinSound.audio.isPlaying) { this.CoinSound.audio.stop(); }
        this.CoinSound.Play();
    }
    PlaySpikeSFX() {
        this.SpikeSound.Play();
    }

    Update(_dt, _inputManager) {
        if (this.inputDelay > 0) { this.inputDelay = MoveTowards(this.inputDelay, 0, _dt); }
        else {
            let volumeAxis = 0;
            if (_inputManager.IsKeyHeld("BracketRight") || _inputManager.IsKeyHeld("NumpadAdd")) { volumeAxis++; }
            if (_inputManager.IsKeyHeld("Slash") || _inputManager.IsKeyHeld("NumpadSubtract")) { volumeAxis--; }
            if (volumeAxis != 0) {
                this.volume = MoveTowards(this.volume, volumeAxis > 0 ? 1 : 0, 0.1);
                this.audioListener.setMasterVolume(this.volume);
                this.inputDelay = 0.25;
            }
        }
    }
}