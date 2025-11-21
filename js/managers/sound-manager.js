/**
 * Trade-X Sound Manager
 * Manages audio synthesis and sound effects using Tone.js
 */

const SoundManager = {
    synths: {},
    initializeSynths() {
        try {
            const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.4 }).toDestination();
            this.synths = {
                kaching: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 8, modulationIndex: 2, volume: -8, envelope: { attack: 0.01, decay: 0.3, release: 0.4 }, modulationEnvelope: { attack: 0.01, decay: 0.2, release: 0.2 } }).connect(reverb),
                click: new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 3, envelope: { attack: 0.001, decay: 0.15, release: 0.01 }, volume: -12 }).toDestination(),
                reset: new Tone.FMSynth({ harmonicity: 1.5, envelope: { attack: 0.01, decay: 0.5, release: 0.1 }, volume: -5 }).toDestination(),
                error: new Tone.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 }, volume: -5 }).connect(new Tone.BitCrusher(4).toDestination()),
                sweep: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, release: 0.1 }, volume: -20 }).connect(new Tone.AutoFilter("8n").toDestination().start()),
                undo: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, release: 0.1 }, volume: -20 }).connect(new Tone.AutoFilter("8n").toDestination().start()),
                redo: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, release: 0.1 }, volume: -20 }).connect(new Tone.AutoFilter("8n").toDestination().start()),
                // Tycoon Edition: Dynamic profit sounds
                smallProfit: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 8, modulationIndex: 2, volume: -10, envelope: { attack: 0.01, decay: 0.2, release: 0.3 }, modulationEnvelope: { attack: 0.01, decay: 0.2, release: 0.2 } }).connect(reverb),
                bigProfit: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 8, modulationIndex: 2, volume: -6, envelope: { attack: 0.01, decay: 0.4, release: 0.5 }, modulationEnvelope: { attack: 0.01, decay: 0.2, release: 0.2 } }).connect(reverb),
                hugeProfit: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 8, modulationIndex: 2, volume: -4, envelope: { attack: 0.01, decay: 0.5, release: 0.6 }, modulationEnvelope: { attack: 0.01, decay: 0.2, release: 0.2 } }).connect(reverb),
            };
        } catch (e) { console.error("Audio-Context konnte nicht initialisiert werden:", e); }
    },
    async playSound(soundName, profitAmount = 0) {
        if (Tone.context.state !== 'running') { try { await Tone.start(); } catch (e) { console.error("Tone.js konnte nicht gestartet werden.", e); return; } }
        if (!this.synths[soundName]) { console.warn(`Sound ${soundName} not found.`); return; }
        try {
            const now = Tone.now();
            switch(soundName) {
                case 'kaching': this.synths.kaching.triggerAttackRelease(['E6', 'G#6'], '16n', now); break;
                case 'click': this.synths.click.triggerAttackRelease("C4", "32n", now); break;
                case 'reset': this.synths.reset.triggerAttack("G4", now); this.synths.reset.frequency.exponentialRampToValueAtTime("G2", now + 0.4); this.synths.reset.triggerRelease(now + 0.4); break;
                case 'error': this.synths.error.triggerAttackRelease("0.1", now); break;
                case 'undo': this.synths.sweep.filter.frequency.setValueAtTime(1200, now); this.synths.sweep.filter.frequency.exponentialRampToValueAtTime(300, now + 0.1); this.synths.sweep.triggerAttackRelease("0.1", now); break;
                case 'redo': this.synths.sweep.filter.frequency.setValueAtTime(300, now); this.synths.sweep.filter.frequency.exponentialRampToValueAtTime(1200, now + 0.1); this.synths.sweep.triggerAttackRelease("0.1", now); break;
                // Tycoon Edition: Dynamic profit sounds
                case 'smallProfit': this.synths.smallProfit.triggerAttackRelease(['C6'], '16n', now); break;
                case 'bigProfit': this.synths.bigProfit.triggerAttackRelease(['E6', 'G#6'], '16n', now); break;
                case 'hugeProfit':
                    // Play a chord progression for huge profits (like speculation bubble)
                    this.synths.hugeProfit.triggerAttackRelease(['E6', 'G#6', 'B6'], '8n', now);
                    this.synths.hugeProfit.triggerAttackRelease(['F#6', 'A#6', 'C#7'], '8n', now + 0.15);
                    this.synths.hugeProfit.triggerAttackRelease(['G#6', 'B6', 'D#7'], '8n', now + 0.3);
                    break;
            }
        } catch (err) { console.error(`Fehler beim Abspielen des Sounds '${soundName}':`, err); }
    },
    // Tycoon Edition: Play dynamic sound based on profit
    playProfitSound(profitAmount) {
        if (profitAmount <= 0) return;
        if (profitAmount >= 20) {
            this.playSound('hugeProfit', profitAmount);
        } else if (profitAmount >= 10) {
            this.playSound('bigProfit', profitAmount);
        } else {
            this.playSound('smallProfit', profitAmount);
        }
    }
};
