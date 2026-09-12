// نظام التنبيهات الصوتية التلقائي عبر Web Audio API
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  // صوت إشعار وصول طلب جديد للمندوب (جرس ناعم من نغمتين متصاعدتين)
  playOrderAssigned() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      // نغمة 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // نغمة 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.38); // D6
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // صوت تنبيه قوي ومميز لإسناد شحنة جديدة للمندوب (نغمة إشعار مسموعة حتى لو كان المندوب يقود السيارة)
  playDriverAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      // تسلسل نغمات التنبيه الميداني (رنين ثلاثي متصاعد ومكرر مرتين)
      const notes = [
        { f: 587.33, t: 0.00, d: 0.12 }, // D5
        { f: 880.00, t: 0.14, d: 0.14 }, // A5
        { f: 1174.66, t: 0.30, d: 0.25 }, // D6
        { f: 880.00, t: 0.60, d: 0.12 }, // تكرار النبضة الثانية
        { f: 1174.66, t: 0.74, d: 0.14 },
        { f: 1567.98, t: 0.90, d: 0.35 }  // G6 ذروة التنبيه
      ];

      notes.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);
        gain.gain.setValueAtTime(0.45, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);
      });
    } catch (e) {
      console.warn('Audio FX alert error:', e);
    }
  }

  // صوت إتمام التوصيل أو التحصيل المالي (نجاح)
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // صوت توريد وتسوية الكاش (كاشير رنان)
  playCashRegister() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio FX error:', e);
    }
  }

  // صوت النقر الخفيف
  click() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // صوت التأكيد أو الإجراء المنبثق
  pop() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // صوت التنبيه أو رفض مسح الباركود (طنين تحذيري)
  playOrderAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      [220, 180].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.12);
        gain.gain.setValueAtTime(0.25, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.18);
      });
    } catch (e) {}
  }

  playError() {
    this.playOrderAlert();
  }
}

export const sound = new SoundFX();
