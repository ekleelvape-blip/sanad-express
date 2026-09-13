// =========================================================================
// نظام الهوية الصوتية والتنبيهات المخصصة لمنصة سَنَد (SANAD Sonic Brand System)
// تصميم صوتي مخصص واحترافي عبر Web Audio API مع دعم التنبيهات الميدانية
// =========================================================================

class SanadSoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.voiceEnabled = true;
    this.volume = 0.85;

    // استرجاع تفضيلات الصوت من التخزين المحلي
    try {
      if (typeof window !== 'undefined') {
        const savedEnabled = localStorage.getItem('sanad_sound_enabled');
        if (savedEnabled !== null) this.enabled = savedEnabled === 'true';

        const savedVoice = localStorage.getItem('sanad_voice_enabled');
        if (savedVoice !== null) this.voiceEnabled = savedVoice === 'true';

        const savedVol = localStorage.getItem('sanad_sound_volume');
        if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.85;
      }
    } catch (e) {}
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  // تحديث الإعدادات وحفظها
  setAudioSettings({ enabled, voiceEnabled, volume }) {
    if (enabled !== undefined) {
      this.enabled = Boolean(enabled);
      try { localStorage.setItem('sanad_sound_enabled', String(this.enabled)); } catch (e) {}
    }
    if (voiceEnabled !== undefined) {
      this.voiceEnabled = Boolean(voiceEnabled);
      try { localStorage.setItem('sanad_voice_enabled', String(this.voiceEnabled)); } catch (e) {}
    }
    if (volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, Number(volume) || 0.85));
      try { localStorage.setItem('sanad_sound_volume', String(this.volume)); } catch (e) {}
    }
  }

  // نطق نصي باللغة العربية
  speakArabic(text) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = this.volume;

      // محاولة اختيار صوت عربي رسمي إن وجد في النظام
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  // 1. نغمة هوية سَنَد الرسمية (The SANAD Signature Sonic Brand Logo)
  // لحن خماسي نقي دافئ متصاعد يمثل (سـ - نـ - د): C5 -> E5 -> G5 -> C6 مع هرمونيك بلوري دافئ
  playSanadBrand() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      // سلم نغمات سَنَد الرباعي (Arpeggio: C5, E5, G5, C6) مع صدى الجرس
      const sanadMotif = [
        { freq: 523.25, time: 0.00, dur: 0.35, type: 'sine', gain: 0.28 },     // سـ (C5)
        { freq: 659.25, time: 0.12, dur: 0.38, type: 'triangle', gain: 0.32 }, // نـ (E5)
        { freq: 783.99, time: 0.24, dur: 0.45, type: 'sine', gain: 0.35 },     // ـد (G5)
        { freq: 1046.50, time: 0.38, dur: 0.85, type: 'sine', gain: 0.42 },    // سَنَد قمة النغمة (C6)
        { freq: 2093.00, time: 0.38, dur: 0.90, type: 'sine', gain: 0.15 }     // النقاء البلوري (C7 Shimmer)
      ];

      // نبضة بيز أساسية عميقة ودافئة تعطي وزناً لهوية سَنَد اللوجستية
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(130.81, now); // C3
      bassOsc.frequency.exponentialRampToValueAtTime(65.41, now + 0.5);
      bassGain.gain.setValueAtTime(0.25, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.6);

      // عزف النغمات الهرمونية المتصاعدة
      sanadMotif.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = note.type;
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(note.gain, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });
    } catch (e) {
      console.warn('SANAD Sound Brand Error:', e);
    }
  }

  // 2. رنين تنبيه المندوب أثناء القيادة الميدانية (SANAD Driver Road Dispatch Siren)
  // رنين قوي، نقي، ومكرر لا يمكن تفويته وسط ضوضاء الشارع أو زحام المركبة
  playDriverAlert() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      // نبضتان حادتان للتنبيه ثم لحن سَنَد السريع
      const roadNotes = [
        { f: 880.00, t: 0.00, d: 0.12, type: 'triangle', g: 0.5 },
        { f: 1174.66, t: 0.14, d: 0.14, type: 'triangle', g: 0.55 },
        { f: 1396.91, t: 0.30, d: 0.22, type: 'sine', g: 0.6 },
        // التكرار التأكيدي لضمان الانتباه
        { f: 880.00, t: 0.60, d: 0.12, type: 'triangle', g: 0.5 },
        { f: 1174.66, t: 0.74, d: 0.14, type: 'triangle', g: 0.55 },
        { f: 1760.00, t: 0.90, d: 0.45, type: 'sine', g: 0.65 } // A6 ذروة التنبيه
      ];

      roadNotes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = n.type;
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(n.g, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });

      // تنبيه ناطق بعد ثانية واحدة للمندوب
      setTimeout(() => {
        this.speakArabic('سَنَد: وصلك طلب مسند جديد');
      }, 1100);
    } catch (e) {
      console.warn('SANAD Driver Alert Error:', e);
    }
  }

  // صوت وصول طلب جديد للمنصة
  playOrderAssigned() {
    this.playSanadBrand();
  }

  // 3. نغمة تأكيد التسليم وإثبات الشحنة بنجاح (SANAD Delivery Success & POD)
  // وتر نصر متصاعد وفخم يمنح شعوراً رائعاً بالإنجاز وتوثيق الاستلام
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      // وتر دو ماجور متصاعد مع رنين احتفالي
      const chordNotes = [
        { f: 440.00, t: 0.00, d: 0.35 },  // A4
        { f: 554.37, t: 0.08, d: 0.40 },  // C#5
        { f: 659.25, t: 0.16, d: 0.45 },  // E5
        { f: 880.00, t: 0.24, d: 0.65 },  // A5
        { f: 1760.00, t: 0.32, d: 0.80 }  // A6 Harmonic
      ];

      chordNotes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.35, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } catch (e) {
      console.warn('SANAD Success Chime Error:', e);
    }
  }

  // 4. نغمة توريد الكاش والخزينة والتحصيل المالي (SANAD Cash Vault Chime)
  // نقرة خزينة حديدية ناعمة متبوعة بصوت لمعان العملات النقدية
  playCashRegister() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      // نقرة الخزينة
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(280, now);
      clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
      clickGain.gain.setValueAtTime(0.2, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      clickOsc.connect(clickGain);
      clickGain.connect(masterGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.05);

      // رنين الكاش المزدوج (Double Coin Clink)
      [
        { f: 1318.51, t: 0.06, d: 0.35 },
        { f: 1760.00, t: 0.12, d: 0.45 },
        { f: 2637.02, t: 0.18, d: 0.60 }
      ].forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.25, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } catch (e) {
      console.warn('SANAD Cash Sound Error:', e);
    }
  }

  // 5. نقر خفيف للملاحة والتفاعل
  click() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
      gain.gain.setValueAtTime(0.05 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // 6. صوت النبض والتأكيد المنبثق
  pop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // 7. صوت التنبيه أو الرفض
  playOrderAlert() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      [260, 200].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.12);
        gain.gain.setValueAtTime(0.2 * this.volume, now + i * 0.12);
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

export const sound = new SanadSoundSystem();
