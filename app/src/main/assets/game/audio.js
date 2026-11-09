// Procedural Web Audio API Sound Synthesizer & Era-Adaptive Music Engine
// Age of Warriors: 100% Procedural Audio (Zero External Asset Dependencies)

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true; // Sound Effects (SFX) enabled
        this.musicEnabled = true; // Background Music enabled
        this.musicVolume = 0.65; // Music volume (0.0 to 1.0)
        this.currentEra = 0;

        this.sfxGain = null;
        this.musicGain = null;

        // Sequencer clock
        this.isPlayingMusic = false;
        this.currentStep = 0;
        this.nextNoteTime = 0;
        this.timerID = null;

        // Musical frequencies (Hz)
        this.N = {
            'A1': 55.00, 'C2': 65.41, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
            'C6': 1046.50
        };
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();

                // Master SFX Gain
                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = this.enabled ? 1.0 : 0.0;
                this.sfxGain.connect(this.ctx.destination);

                // Master Music Gain
                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.value = this.musicEnabled ? (this.musicVolume * 0.42) : 0.0;
                this.musicGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.musicEnabled && !this.isPlayingMusic && this.ctx) {
            this.startMusic();
        }
    }

    // ==========================================
    // AUDIO SETTINGS TOGGLES
    // ==========================================
    setEnabled(val) {
        this.enabled = val;
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(val ? 1.0 : 0.0, this.ctx.currentTime);
        }
    }

    setMusicEnabled(val) {
        this.musicEnabled = val;
        if (this.musicGain && this.ctx) {
            const target = val ? (this.musicVolume * 0.42) : 0.0;
            this.musicGain.gain.setValueAtTime(target, this.ctx.currentTime);
        }
        if (val) {
            this.init();
            if (!this.isPlayingMusic) this.startMusic();
        } else {
            this.stopMusic();
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        if (this.musicGain && this.ctx && this.musicEnabled) {
            this.musicGain.gain.setValueAtTime(this.musicVolume * 0.42, this.ctx.currentTime);
        }
    }

    setEra(eraIndex) {
        this.currentEra = eraIndex;
        // Reset measure step on era evolve so theme aligns cleanly
        this.currentStep = 0;
    }

    // ==========================================
    // ERA-ADAPTIVE PROCEDURAL MUSIC ENGINE
    // ==========================================
    startMusic() {
        if (!this.ctx) this.init();
        if (!this.ctx || this.isPlayingMusic) return;

        this.isPlayingMusic = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;

        const scheduleLoop = () => {
            if (!this.isPlayingMusic) return;
            // Standard Web Audio lookahead scheduler (Chris Wilson clock pattern)
            const scheduleAheadTime = 0.12;
            while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
                this.scheduleStep(this.currentStep, this.nextNoteTime);
                const stepDuration = this.getStepDuration();
                this.nextNoteTime += stepDuration;
                this.currentStep = (this.currentStep + 1) % 16;
            }
            this.timerID = setTimeout(scheduleLoop, 25);
        };

        scheduleLoop();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    getBPM() {
        switch (this.currentEra) {
            case 0: return 108; // Stone Age: Heavy tribal tempo
            case 1: return 114; // Bronze Age: Desert war march
            case 2: return 120; // Iron Age: Medieval knights cadence
            case 3: return 128; // Modern War: Driving energetic pulse
            default: return 112;
        }
    }

    getStepDuration() {
        // Sixteenth-note step duration
        return (60.0 / this.getBPM()) / 4.0;
    }

    scheduleStep(step, time) {
        if (!this.musicEnabled || !this.ctx) return;

        switch (this.currentEra) {
            case 0:
                this.playStoneAgeTrack(step, time);
                break;
            case 1:
                this.playBronzeAgeTrack(step, time);
                break;
            case 2:
                this.playIronAgeTrack(step, time);
                break;
            case 3:
                this.playModernWarTrack(step, time);
                break;
            default:
                this.playStoneAgeTrack(step, time);
        }
    }

    // --- Era 0: Stone Age (Tribal War Drums, Earthy Bass, Primitive Flute) ---
    playStoneAgeTrack(step, time) {
        // Primal Kick Drum (heavy heartbeat pulse)
        if (step === 0 || step === 6 || step === 8 || step === 14) {
            this.synthKick(time, 130, 32, 0.22, 0.35);
        }

        // Resonant Primitive War Toms
        if (step === 2 || step === 4 || step === 10 || step === 12) {
            const pitch = (step === 2 || step === 10) ? 170 : 210;
            this.synthTom(time, pitch, 0.18, 0.28);
        }

        // Tribal Wood Stick / Shaker
        if (step % 2 === 1) {
            this.synthShaker(time, 0.08);
        }

        // Earthy Drone Bass (A2 - G2 - D2)
        if (step === 0) {
            this.synthBassNote(time, this.N['A1'], 0.5, 'triangle', 0.28);
        } else if (step === 8) {
            this.synthBassNote(time, this.N['D2'], 0.5, 'triangle', 0.26);
        }

        // Primitive Pentatonic Bone Flute Melody
        const fluteNotes = {
            0: this.N['A3'],
            4: this.N['C4'],
            7: this.N['D4'],
            10: this.N['C4'],
            12: this.N['G3'],
            14: this.N['A3']
        };
        if (fluteNotes[step]) {
            this.synthFluteNote(time, fluteNotes[step], 0.25, 0.18);
        }
    }

    // --- Era 1: Bronze Age (Pharaonic Desert March, Doumbek, Exotic Oud Pluck) ---
    playBronzeAgeTrack(step, time) {
        // Doumbek Rhythm (Dum-Tak-Tak-Dum-Tak)
        if (step === 0 || step === 6 || step === 10) {
            this.synthKick(time, 140, 45, 0.18, 0.32); // Deep Dum
        }
        if (step === 4 || step === 8 || step === 12 || step === 14) {
            this.synthRim(time, 0.2); // Sharp Tak
        }
        if (step % 2 === 1) {
            this.synthTambourine(time, 0.09);
        }

        // Desert Bass (D2 - Eb2 - D2)
        if (step === 0) this.synthBassNote(time, this.N['D2'], 0.45, 'sawtooth', 0.22);
        if (step === 6) this.synthBassNote(time, this.N['Eb2'], 0.35, 'sawtooth', 0.20);
        if (step === 10) this.synthBassNote(time, this.N['D2'], 0.45, 'sawtooth', 0.22);

        // Plucked Desert Oud / Sitar (Phrygian Dominant: D - Eb - F# - G - A)
        const oudNotes = {
            0: this.N['D4'],
            2: this.N['Eb4'],
            4: this.N['F#4'],
            6: this.N['G4'],
            8: this.N['A4'],
            10: this.N['Bb4'],
            12: this.N['A4'],
            14: this.N['F#4']
        };
        if (oudNotes[step]) {
            this.synthPluck(time, oudNotes[step], 0.22, 0.22);
        }
    }

    // --- Era 2: Iron Age (Medieval Knights Fanfare, Marching Snare, French Horns) ---
    playIronAgeTrack(step, time) {
        // Marching Snare & Bass Cadence
        if (step === 0 || step === 8) {
            this.synthKick(time, 120, 40, 0.2, 0.35);
        }
        if (step === 4 || step === 12) {
            this.synthSnare(time, 0.28);
        }
        if (step === 14 || step === 15) {
            this.synthSnare(time, 0.16); // Military roll
        }
        if (step % 2 === 0) {
            this.synthShaker(time, 0.07);
        }

        // Chivalric Bass (D2 -> F2 -> C2 -> G2)
        if (step === 0) this.synthBassNote(time, this.N['D2'], 0.4, 'triangle', 0.28);
        if (step === 8) this.synthBassNote(time, this.N['C2'], 0.4, 'triangle', 0.28);

        // Noble Brass Horn Fanfare (D minor heraldic anthem)
        const hornNotes = {
            0: this.N['D3'],
            2: this.N['F3'],
            4: this.N['A3'],
            8: this.N['C4'],
            10: this.N['D4'],
            12: this.N['A3']
        };
        if (hornNotes[step]) {
            this.synthBrassHorn(time, hornNotes[step], 0.32, 0.22);
        }
    }

    // --- Era 3: Modern War (High-Octane Techno/Industrial War Pulse) ---
    playModernWarTrack(step, time) {
        // Punchy 4-on-the-Floor Electronic Kick
        if (step % 4 === 0) {
            this.synthKick(time, 160, 28, 0.15, 0.42);
        }

        // Modern Combat Snare
        if (step === 4 || step === 12) {
            this.synthSnare(time, 0.32);
        }

        // Hi-Hat on offbeats
        if (step % 2 === 1) {
            this.synthHiHat(time, step % 4 === 2, 0.14);
        }

        // Rolling 16th-note Synth Bassline
        const bassNotes = [this.N['E2'], this.N['E2'], this.N['G2'], this.N['E2'],
                           this.N['A2'], this.N['E2'], this.N['G2'], this.N['E2']];
        this.synthBassNote(time, bassNotes[step % 8], 0.12, 'sawtooth', 0.24);

        // Arpeggiated Cyber War Lead
        const arpNotes = {
            0: this.N['E4'],
            2: this.N['G4'],
            4: this.N['B4'],
            6: this.N['D5'],
            8: this.N['E5'],
            10: this.N['D5'],
            12: this.N['B4'],
            14: this.N['G4']
        };
        if (arpNotes[step]) {
            this.synthSynthLead(time, arpNotes[step], 0.14, 0.16);
        }
    }

    // ==========================================
    // PROCEDURAL INSTRUMENT SYNTHESIZERS
    // ==========================================
    synthKick(time, startFreq, endFreq, decay, gainAmt) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay);

        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + decay + 0.01);
    }

    synthTom(time, freq, decay, gainAmt) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.45, time + decay);

        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + decay + 0.01);
    }

    synthSnare(time, gainAmt) {
        if (!this.ctx || !this.musicGain) return;
        // Snare noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
    }

    synthHiHat(time, open = false, gainAmt = 0.12) {
        if (!this.ctx || !this.musicGain) return;
        const dur = open ? 0.16 : 0.05;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
    }

    synthShaker(time, gainAmt = 0.08) {
        if (!this.ctx || !this.musicGain) return;
        const dur = 0.04;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(4500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
    }

    synthRim(time, gainAmt = 0.18) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(300, time + 0.05);

        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + 0.06);
    }

    synthTambourine(time, gainAmt = 0.1) {
        if (!this.ctx || !this.musicGain) return;
        const dur = 0.08;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
    }

    synthBassNote(time, freq, dur, type = 'triangle', gainAmt = 0.25) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, time);

        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.01);
    }

    synthFluteNote(time, freq, dur, gainAmt = 0.18) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        // Subtle organic vibrato
        osc.frequency.linearRampToValueAtTime(freq * 1.015, time + dur * 0.5);
        osc.frequency.linearRampToValueAtTime(freq, time + dur);

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(gainAmt, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.01);
    }

    synthPluck(time, freq, dur, gainAmt = 0.22) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, time);
        filter.frequency.exponentialRampToValueAtTime(400, time + dur);

        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.01);
    }

    synthBrassHorn(time, freq, dur, gainAmt = 0.22) {
        if (!this.ctx || !this.musicGain) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.006, time); // Subtle detune for brass thickness

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, time);
        filter.frequency.linearRampToValueAtTime(800, time + dur);

        gain.gain.setValueAtTime(0.02, time);
        gain.gain.linearRampToValueAtTime(gainAmt, time + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + dur + 0.02);
        osc2.stop(time + dur + 0.02);
    }

    synthSynthLead(time, freq, dur, gainAmt = 0.16) {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, time);

        gain.gain.setValueAtTime(gainAmt, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur + 0.01);
    }

    // ==========================================
    // SOUND EFFECTS (SFX)
    // ==========================================
    playMeleeHit() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    playRangedAttack() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.11);
    }

    playAirWhistle() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.7);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.72);
    }

    playGunshot() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    playExplosion() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    playCoin() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc1.stop(now + 0.08);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.28);
    }

    playSpawn() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const start = this.ctx.currentTime + (idx * 0.11);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.3, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.26);
        });
    }

    playDefeat() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const notes = [400, 350, 300, 240];
        notes.forEach((freq, idx) => {
            const start = this.ctx.currentTime + (idx * 0.14);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.22);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.23);
        });
    }

    playEvolve() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || !this.sfxGain) return;
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
            const start = this.ctx.currentTime + (idx * 0.09);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.35, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.36);
        });
    }
}

window.soundManager = new SoundManager();
