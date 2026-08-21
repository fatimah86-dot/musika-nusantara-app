/**
 * Musika Nusantara Web Audio Koplo & Pop Jawa Sound Engine
 * Synthesizes dynamic Indonesian rhythms (Kendang, Suling, Synth Brass, Glerr Sub-bass)
 * with real-time playback, audio reactivity, seek controls, and WAV file generation.
 */

class KoploAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private bpm: number = 138;
  private tone: 'energetic' | 'acoustic' | 'horeg' | 'mellow' = 'energetic';
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private listeners: ((time: number, isPlaying: boolean) => void)[] = [];
  private currentTime: number = 0;
  private duration: number = 195;
  private startTime: number = 0;
  private pausedAt: number = 0;

  constructor() {
    // Lazy init AudioContext on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSong(bpm: number, tone: 'energetic' | 'acoustic' | 'horeg' | 'mellow' = 'energetic', duration: number = 195) {
    this.bpm = bpm;
    this.tone = tone;
    this.duration = duration;
    this.seek(0);
  }

  public play() {
    this.initContext();
    if (!this.ctx || this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.pausedAt;

    const stepInterval = (60 / this.bpm) / 4; // 16th notes
    let nextStepTime = this.ctx.currentTime;

    const schedule = () => {
      if (!this.isPlaying || !this.ctx) return;

      while (nextStepTime < this.ctx.currentTime + 0.1) {
        this.scheduleKoploStep(this.currentStep, nextStepTime);
        this.currentStep = (this.currentStep + 1) % 16;
        nextStepTime += stepInterval;
      }

      this.currentTime = this.ctx.currentTime - this.startTime;
      if (this.currentTime >= this.duration) {
        this.seek(0);
      }

      this.notifyListeners();
      this.timerId = window.requestAnimationFrame(schedule);
    };

    schedule();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      window.cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
    if (this.ctx) {
      this.pausedAt = this.ctx.currentTime - this.startTime;
    }
    this.notifyListeners();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    this.pausedAt = Math.max(0, Math.min(seconds, this.duration));
    this.currentTime = this.pausedAt;
    this.currentStep = Math.floor((this.currentTime / ((60 / this.bpm) / 4)) % 16);
    if (this.ctx && this.isPlaying) {
      this.startTime = this.ctx.currentTime - this.pausedAt;
    }
    this.notifyListeners();
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getAudioFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(16);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public subscribe(fn: (time: number, isPlaying: boolean) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.currentTime, this.isPlaying));
  }

  // Koplo Sound Synthesis Logic (Kendang Tak-Tung, Sub-Dut, Brass Stabs, Melody)
  private scheduleKoploStep(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Kendang Patterns (16-step rhythmic grid)
    // 0: Kick/Dut, 2: Tak, 4: Dut, 6: Tung, 8: Tak, 10: Dut, 12: Tak-Tung roll, 14: Kendang slap
    if (this.tone === 'energetic' || this.tone === 'horeg') {
      // Kendang DUT (Sub low thump)
      if (step === 0 || step === 4 || step === 8 || step === 11) {
        this.playKendangDut(time, step === 0 ? 1.0 : 0.85);
      }

      // Kendang TAK (Crisp high slap)
      if (step === 2 || step === 6 || step === 10 || step === 13 || step === 15) {
        this.playKendangTak(time, step === 6 ? 0.9 : 0.7);
      }

      // Kendang TUNG (Resonant bell ring)
      if (step === 3 || step === 7 || step === 12 || step === 14) {
        this.playKendangTung(time, 0.75);
      }

      // Hi-Hat / Tambourine Kecrek
      if (step % 2 === 1) {
        this.playKecrek(time, 0.35);
      }

      // Bass Groove (Minor pentatonic / Koplo walking bass)
      const bassNotes = [55, 55, 65.4, 73.4, 55, 82.4, 73.4, 65.4]; // A1, C2, D2, E2
      const bassNote = bassNotes[Math.floor(step / 2) % bassNotes.length];
      if (step % 2 === 0) {
        this.playKoploBass(time, bassNote, (60 / this.bpm) / 3);
      }

      // Synth Brass Stabs on off-beats
      if (step === 4 || step === 12) {
        this.playSynthBrassChord(time, [220, 261.63, 329.63]); // Am chord
      } else if (step === 8) {
        this.playSynthBrassChord(time, [196, 246.94, 293.66]); // G chord
      }

      // Melody Lead Suling / Lead Synth
      if (step % 4 === 0) {
        const leadNotes = [440, 523.25, 587.33, 659.25, 783.99]; // A4, C5, D5, E5, G5
        const melodyNote = leadNotes[Math.floor((this.currentTime * 2) % leadNotes.length)];
        this.playSulingFlute(time, melodyNote, 0.25);
      }
    } else {
      // Acoustic / Pop Jawa Ambyar (Piano, soft Kendang, Melodic Strings)
      if (step === 0 || step === 8) {
        this.playKendangDut(time, 0.6);
      }
      if (step === 4 || step === 12) {
        this.playKendangTak(time, 0.4);
      }
      if (step % 4 === 0) {
        this.playAcousticPianoChord(time, [220, 261.63, 329.63, 440]);
      }
      if (step % 2 === 0) {
        this.playSulingFlute(time, 329.63 + (step * 20), 0.4);
      }
    }
  }

  // --- Sound Generation Instruments ---

  // Kendang "Dut" (Deep low pitch glide 120Hz -> 45Hz)
  private playKendangDut(time: number, gainVal: number = 0.8) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const isHoreg = this.tone === 'horeg';
    const startFreq = isHoreg ? 150 : 130;
    const endFreq = isHoreg ? 32 : 45;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.18);

    gain.gain.setValueAtTime(gainVal * (isHoreg ? 1.2 : 0.9), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isHoreg ? 0.35 : 0.22));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + (isHoreg ? 0.35 : 0.22));
  }

  // Kendang "Tak" (Crisp snappy slap with bandpass noise + high oscillator)
  private playKendangTak(time: number, gainVal: number = 0.7) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.06);

    gain.gain.setValueAtTime(gainVal * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  // Kendang "Tung" (Resonant wooden drum bell ring ~280Hz)
  private playKendangTung(time: number, gainVal: number = 0.7) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(290, time);
    osc.frequency.exponentialRampToValueAtTime(240, time + 0.15);

    gain.gain.setValueAtTime(gainVal * 0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  // Kecrek / Tambourine / Hi-Hat
  private playKecrek(time: number, gainVal: number = 0.3) {
    if (!this.ctx || !this.masterGain) return;
    // White noise burst
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(time);
  }

  // Koplo Bassline (Sawtooth + Lowpass filter)
  private playKoploBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Synth Brass Stabs (Punchy brass chords)
  private playSynthBrassChord(time: number, freqs: number[]) {
    if (!this.ctx || !this.masterGain) return;
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + 0.2);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.22);
    });
  }

  // Suling Flute Melody (Sine with soft vibrato)
  private playSulingFlute(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Add subtle microtonal pitch bend (khas gamelan cengkok)
    osc.frequency.linearRampToValueAtTime(freq * 1.02, time + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(freq, time + duration);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Acoustic Piano chord for Pop Jawa
  private playAcousticPianoChord(time: number, freqs: number[]) {
    if (!this.ctx || !this.masterGain) return;
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.7);
    });
  }

  // Play Koplo Vocal Soundboard Effects ("Tarik Sis!", "Semongko!", "Hak e Hak e!")
  public playKoploVoiceCue(cueText: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Pitch & Sound effect blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);

    // Browser Speech Synthesis for authentic shoutout
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cueText);
        utterance.lang = 'id-ID';
        utterance.pitch = 1.35;
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      } catch {
        // speech synthesis fallback
      }
    }
  }

  // Render a real downloadable WAV / MP3 Audio File
  public generateAudioDownloadBlob(songTitle: string, durationSec: number = 60): { url: string; fileName: string } {
    // Generate valid stereo WAV audio buffer
    const sampleRate = 44100;
    const numChannels = 2;
    const numFrames = sampleRate * Math.min(durationSec, 90);
    const buffer = new ArrayBuffer(44 + numFrames * numChannels * 2);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numFrames * numChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numFrames * numChannels * 2, true);

    // Synthesize Koplo Waveform data
    let offset = 44;
    const bpm = this.bpm;
    const stepDuration = (60 / bpm) / 4;

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const step = Math.floor((t / stepDuration) % 16);

      // Bass & Kick Dut synthesis
      let sample = 0;
      if (step === 0 || step === 4 || step === 8 || step === 11) {
        sample += Math.sin(2 * Math.PI * (120 - ((t % 0.2) * 400)) * t) * 0.45;
      }
      // Tak & Tung
      if (step === 2 || step === 6 || step === 10) {
        sample += Math.sin(2 * Math.PI * 340 * t) * 0.3;
      }
      // Melodic Brass tone
      sample += Math.sin(2 * Math.PI * 220 * t) * 0.2;
      // Harmonics
      sample += Math.sin(2 * Math.PI * 440 * t) * 0.1;

      // Soft clamp
      sample = Math.max(-1, Math.min(1, sample));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;

      view.setInt16(offset, int16, true);
      view.setInt16(offset + 2, int16, true);
      offset += 4;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const sanitizedTitle = songTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return {
      url,
      fileName: `${sanitizedTitle}_musika_nusantara.mp3`
    };
  }
}

export const audioPlayer = new KoploAudioEngine();
