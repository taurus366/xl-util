import { Injectable } from '@angular/core';

export type SoundPreset = 'ding' | 'double-ding' | 'soft' | 'alert' | 'new-order';

@Injectable({ providedIn: 'root' })
export class SoundService {

    private ctx: AudioContext | null = null;

    private getCtx(): AudioContext {
        if (!this.ctx) {
            this.ctx = new AudioContext();
            const unlock = () => {
                this.ctx?.resume();
                document.removeEventListener('click', unlock);
                document.removeEventListener('keydown', unlock);
            };
            document.addEventListener('click', unlock);
            document.addEventListener('keydown', unlock);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    play(preset: SoundPreset = 'ding') {
        try {
            const ctx = this.getCtx();
            switch (preset) {
                case 'ding':        return this.playDing(ctx);
                case 'double-ding': return this.playDoubleDing(ctx);
                case 'soft':        return this.playSoft(ctx);
                case 'alert':       return this.playAlert(ctx);
                case 'new-order':   return this.playNewOrder(ctx);
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

    // Три ноти нагоре — ясно и натоятелно
    private playNewOrder(ctx: AudioContext) {
        this.tone(ctx, 523, 0,    0.5, 0.18); // До
        this.tone(ctx, 659, 0.2,  0.5, 0.18); // Ми
        this.tone(ctx, 784, 0.4,  0.5, 0.18); // Сол
        this.tone(ctx, 1047, 0.6, 0.6, 0.35); // До (октава нагоре — по-дълго)
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
