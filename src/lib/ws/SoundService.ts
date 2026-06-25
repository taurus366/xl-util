import { Injectable } from '@angular/core';

export type SoundPreset = 'ding' | 'double-ding' | 'soft' | 'alert';

@Injectable({ providedIn: 'root' })
export class SoundService {

    play(preset: SoundPreset = 'ding') {
        try {
            const ctx = new AudioContext();
            switch (preset) {
                case 'ding':        return this.playDing(ctx);
                case 'double-ding': return this.playDoubleDing(ctx);
                case 'soft':        return this.playSoft(ctx);
                case 'alert':       return this.playAlert(ctx);
            }
        } catch (e) {}
    }

    private playDing(ctx: AudioContext) {
        this.tone(ctx, 880, 0, 0.3, 0.4);
    }

    private playDoubleDing(ctx: AudioContext) {
        this.tone(ctx, 880,  0,   0.3, 0.25);
        this.tone(ctx, 1050, 0.3, 0.3, 0.25);
    }

    private playSoft(ctx: AudioContext) {
        this.tone(ctx, 600, 0, 0.15, 0.5);
    }

    private playAlert(ctx: AudioContext) {
        this.tone(ctx, 660,  0,    0.4, 0.15);
        this.tone(ctx, 880,  0.18, 0.4, 0.15);
        this.tone(ctx, 1100, 0.36, 0.4, 0.2);
    }

    private tone(ctx: AudioContext, frequency: number, startOffset: number, volume: number, duration: number) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        const start = ctx.currentTime + startOffset;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
    }
}
