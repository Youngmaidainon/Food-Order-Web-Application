// Web Audio Context Synthesizer for Customer Live Order Status Updates
class CustomerSoundAlert {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // เล่นเสียงกระดิ่งเตือน (Soft Melodic Chime) เมื่อสถานะออเดอร์ของลูกค้ามีการอัปเดต
  playStatusUpdateChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // สร้างเสียง Bell Tone นุ่มนวล 3 จังหวะ (Harmonious Arpeggio: F5 -> A5 -> C6)
      const playTone = (frequency, startTime, duration, maxVolume = 0.25) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(maxVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // F5 (698.46 Hz) -> A5 (880.00 Hz) -> C6 (1046.50 Hz)
      playTone(698.46, now, 0.45, 0.18);
      playTone(880.00, now + 0.12, 0.55, 0.22);
      playTone(1046.50, now + 0.24, 0.9, 0.28);
    } catch (err) {
      console.warn('Could not play customer update sound chime:', err);
    }
  }

  // เสียงเมื่อลูกค้าสั่งซื้อสำเร็จ (Success Ding)
  playOrderSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const playTone = (frequency, startTime, duration, maxVolume = 0.25) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(maxVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // C5 (523.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)
      playTone(523.25, now, 0.35, 0.15);
      playTone(783.99, now + 0.10, 0.45, 0.20);
      playTone(1046.50, now + 0.22, 0.8, 0.25);
    } catch (err) {
      console.warn('Could not play order success chime:', err);
    }
  }
}

export const customerSoundAlert = new CustomerSoundAlert();
