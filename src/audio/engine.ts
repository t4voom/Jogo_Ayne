import { createLogger } from '../core/log';
import { MELODY, BASS, BEATS_PER_BAR, BPM, type Note } from './melody';

const log = createLogger('audio');

export type Sfx =
  | 'pop'
  | 'sparkle'
  | 'bell'
  | 'page'
  | 'tick'
  | 'whoosh'
  | 'shutter'
  | 'chest'
  | 'unlock'
  | 'swish'
  | 'error';

const A4 = 440;
const freq = (midi: number) => A4 * 2 ** ((midi - 69) / 12);

/**
 * Áudio 100% sintetizado (sem arquivos): uma caixinha de música em loop e
 * efeitos fofos. Só começa depois do primeiro toque (exigência do iOS).
 *
 * Observação: no iPhone, com a chave lateral no silencioso, o Web Audio fica
 * mudo — é regra do sistema.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private musicOn = false;
  private sfxOn = true;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private unlocked = false;

  constructor(private readonly options: { musicVolume?: number; sfxVolume?: number } = {}) {}

  /** Liga o áudio no primeiro gesto da jogadora. */
  installUnlock(target: EventTarget = window): void {
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      this.ensure();
      void this.ctx?.resume();
      if (this.musicOn) this.startMusic();
      for (const t of ['pointerdown', 'keydown', 'touchend'])
        target.removeEventListener(t, unlock, true);
    };
    for (const t of ['pointerdown', 'keydown', 'touchend'])
      target.addEventListener(t, unlock, true);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') void this.ctx.suspend();
      else if (this.unlocked) void this.ctx.resume();
    });
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    // iOS antigo só tem o prefixo webkit.
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) {
      log.warn('Web Audio indisponível');
      return null;
    }
    try {
      const ctx = new Ctor({ latencyHint: 'interactive' });
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = this.options.musicVolume ?? 0.16;
      this.musicGain.connect(this.master);
      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.value = this.options.sfxVolume ?? 0.5;
      this.sfxGain.connect(this.master);
      this.noise = this.makeNoise(ctx);
      this.ctx = ctx;
      return ctx;
    } catch (error) {
      log.error('Não foi possível iniciar o áudio', error);
      return null;
    }
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // ------------------------------------------------------------ música

  setMusic(on: boolean): void {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (this.unlocked) this.startMusic();
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
  }

  private startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || this.schedulerId !== null || !this.musicGain) return;
    this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.exponentialRampToValueAtTime(
      this.options.musicVolume ?? 0.16,
      ctx.currentTime + 2,
    );
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.schedulerId = window.setInterval(() => {
      this.schedule();
    }, 60);
  }

  private stopMusic(): void {
    if (this.schedulerId !== null) window.clearInterval(this.schedulerId);
    this.schedulerId = null;
    if (this.ctx && this.musicGain) {
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    }
  }

  /** Agenda as notas que caem nos próximos ~250 ms (sem engasgos). */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const beat = 60 / BPM;
    const totalBeats = MELODY.reduce((n, note) => n + note.beats, 0);
    while (this.nextNoteTime < ctx.currentTime + 0.25) {
      const { note, at } = noteAt(MELODY, this.step);
      if (note.midi !== null) this.musicBox(note.midi, this.nextNoteTime, note.beats * beat, 0.5);
      // Baixo leve no 1º tempo de cada compasso.
      if (at % BEATS_PER_BAR === 0) {
        const bar = Math.floor(at / BEATS_PER_BAR);
        const bass = BASS[bar % BASS.length];
        if (bass !== undefined) this.musicBox(bass, this.nextNoteTime, beat * 2, 0.28);
      }
      this.nextNoteTime += note.beats * beat;
      this.step = (this.step + 1) % MELODY.length;
      if (this.step === 0 && totalBeats > 0) this.nextNoteTime += beat; // respiro entre voltas
    }
  }

  /** Timbre de caixinha de música: parciais inarmônicos com decaimento. */
  private musicBox(
    midi: number,
    t: number,
    dur: number,
    vel: number,
    out: AudioNode | null = this.musicGain,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !out) return;
    const f = freq(midi);
    const partials: [number, number][] = [
      [1, 1],
      [2.01, 0.32],
      [3.98, 0.12],
      [5.4, 0.05],
    ];
    const g = ctx.createGain();
    const release = Math.max(0.9, dur * 1.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + release);
    g.connect(out);
    for (const [ratio, amp] of partials) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * ratio;
      o.detune.value = (Math.random() - 0.5) * 6;
      const pg = ctx.createGain();
      pg.gain.value = amp;
      o.connect(pg).connect(g);
      o.start(t);
      o.stop(t + release + 0.05);
    }
  }

  // ------------------------------------------------------------ efeitos

  play(sfx: Sfx): void {
    if (!this.sfxOn || !this.unlocked) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime + 0.005;
    const out = this.sfxGain;
    switch (sfx) {
      case 'pop':
        this.sweep(t, 380, 920, 0.09, 0.5, 'sine');
        this.musicBox(84, t + 0.04, 0.2, 0.25, out);
        break;
      case 'sparkle':
        [88, 91, 96, 100].forEach((m, i) => this.musicBox(m, t + i * 0.055, 0.15, 0.16, out));
        break;
      case 'bell':
        [79, 83, 86, 91].forEach((m, i) => this.musicBox(m, t + i * 0.09, 0.4, 0.3, out));
        break;
      case 'unlock':
        [72, 76, 79, 84, 88].forEach((m, i) => this.musicBox(m, t + i * 0.07, 0.3, 0.28, out));
        this.noiseBurst(t, 0.25, 4000, 0.08);
        break;
      case 'chest':
        [67, 71, 74, 79, 83, 86, 91].forEach((m, i) =>
          this.musicBox(m, t + i * 0.06, 0.3, 0.24, out),
        );
        break;
      case 'page':
        this.noiseBurst(t, 0.22, 1800, 0.14, true);
        break;
      case 'tick':
        this.sweep(t, 1500, 1200, 0.03, 0.18, 'triangle');
        break;
      case 'whoosh':
        this.noiseBurst(t, 0.3, 900, 0.22, true);
        this.sweep(t, 600, 180, 0.25, 0.18, 'sine');
        break;
      case 'shutter':
        this.noiseBurst(t, 0.05, 3000, 0.35);
        this.noiseBurst(t + 0.09, 0.07, 2200, 0.3);
        break;
      case 'swish':
        this.noiseBurst(t, 0.18, 2600, 0.12, true);
        break;
      case 'error':
        this.sweep(t, 330, 260, 0.16, 0.3, 'triangle');
        break;
    }
  }

  private sweep(
    t: number,
    from: number,
    to: number,
    dur: number,
    vel: number,
    type: OscillatorType,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(g).connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  private noiseBurst(t: number, dur: number, cutoff: number, vel: number, swept = false): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(cutoff, t);
    if (swept) filter.frequency.exponentialRampToValueAtTime(cutoff * 2.5, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

/** A nota do passo `step` e em que tempo (beat) da música ela cai. */
export function noteAt(melody: readonly Note[], step: number): { note: Note; at: number } {
  let at = 0;
  for (let i = 0; i < step; i++) at += melody[i]?.beats ?? 0;
  const note = melody[step % melody.length] ?? { midi: null, beats: 1 };
  return { note, at };
}
