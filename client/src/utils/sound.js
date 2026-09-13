// =========================================================================
// نظام الهوية الصوتية والتنبيهات الميدانية المتقدمة لمنصة سَنَد
// SANAD Sonic Identity & Background Dispatch Audio System
// يدعم التشغيل بالخلفية، MediaSession، قفل الشاشة Wake Lock، والاهتزاز Vibrate
// =========================================================================

class SanadSoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.voiceEnabled = true;
    this.volume = 0.90;
    this.backgroundModeActive = false;
    this.wakeLock = null;

    // عناصر الصوت HTML5 للعمل بالخلفية
    this.bgAudio = null;
    this.alertAudio = null;
    this.brandAudio = null;

    // استرجاع تفضيلات الصوت من التخزين المحلي
    try {
      if (typeof window !== 'undefined') {
        const savedEnabled = localStorage.getItem('sanad_sound_enabled');
        if (savedEnabled !== null) this.enabled = savedEnabled === 'true';

        const savedVoice = localStorage.getItem('sanad_voice_enabled');
        if (savedVoice !== null) this.voiceEnabled = savedVoice === 'true';

        const savedVol = localStorage.getItem('sanad_sound_volume');
        if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.90;

        // تهيئة مستمع عودة الشاشة لإعادة تفعيل Wake Lock
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.backgroundModeActive) {
            this.requestWakeLock();
          }
        });
      }
    } catch (e) {}
  }

  // تهيئة نظام الصوت وعناصر الـ HTML5
  init() {
    if (typeof window === 'undefined') return;

    // 1. تهيئة Web Audio API
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }

    // 2. تهيئة ملفات الصوت الميدانية
    if (!this.alertAudio) {
      try {
        this.alertAudio = new Audio('/sanad-alert.wav');
        this.alertAudio.preload = 'auto';
        this.alertAudio.volume = this.volume;
      } catch (e) {}
    }

    if (!this.brandAudio) {
      try {
        this.brandAudio = new Audio('/sanad-brand.wav');
        this.brandAudio.preload = 'auto';
        this.brandAudio.volume = this.volume;
      } catch (e) {}
    }

    if (!this.bgAudio) {
      try {
        this.bgAudio = new Audio('/sanad-silent.wav');
        this.bgAudio.loop = true;
        this.bgAudio.volume = 0.05; // حجم منخفض جداً لإبقاء مسار الصوت حياً في الخلفية
      } catch (e) {}
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
      this.volume = Math.max(0, Math.min(1, Number(volume) || 0.90));
      try { localStorage.setItem('sanad_sound_volume', String(this.volume)); } catch (e) {}
      if (this.alertAudio) this.alertAudio.volume = this.volume;
      if (this.brandAudio) this.brandAudio.volume = this.volume;
    }
  }

  // =========================================================================
  // 🛡️ تفعيل وضع العمل بالخلفية وملاحة الطريق (Background Dispatch & Navigation Mode)
  // يضمن عدم إيقاف الصوت عند الانتقال لتطبيقات الخرائط مثل Waze أو Google Maps أو قفل الشاشة
  // =========================================================================
  async enableBackgroundMode(driverName = 'المندوب') {
    this.init();
    this.backgroundModeActive = true;

    // 1. تفعيل حلقة الصوت الصامتة لإبقاء العملية حية
    if (this.bgAudio) {
      try {
        await this.bgAudio.play();
      } catch (e) {
        console.warn('Background audio keepalive auto-play deferred until user interaction');
      }
    }

    // 2. تفعيل MediaSession API للتحكم من شاشة القفل وإشعار النظام بأن التطبيق يعمل في الخلفية
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'سَنَد اللوجستية 🛵 - رادار المناديب نشط',
          artist: `الكابتن: ${driverName}`,
          album: 'وضع التوصيل الميداني والملاحة بالخلفية',
          artwork: [
            { src: '/sanad-express-logo.jpg', sizes: '192x192', type: 'image/jpeg' },
            { src: '/sanad-express-logo.jpg', sizes: '512x512', type: 'image/jpeg' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';

        navigator.mediaSession.setActionHandler('play', () => {
          if (this.bgAudio) this.bgAudio.play();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (this.bgAudio) this.bgAudio.pause();
        });
      } catch (e) {}
    }

    // 3. طلب قفل الشاشة (Screen Wake Lock) لتبقى الشاشة مضاءة أثناء القيادة
    await this.requestWakeLock();
  }

  // إيقاف وضع العمل بالخلفية
  disableBackgroundMode() {
    this.backgroundModeActive = false;
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch (e) {}
    }
    this.releaseWakeLock();
  }

  // طلب إبقاء الشاشة مضاءة (Screen Wake Lock)
  async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.wakeLock) {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }
      } catch (err) {
        console.warn('Screen WakeLock request error:', err);
      }
    }
  }

  // تحرير قفل الشاشة
  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  // اهتزاز الجوال (Haptic Vibration) بنمط التنبيه الميداني لسند
  vibrate(pattern = [400, 150, 400, 150, 600]) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
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

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  // =========================================================================
  // 🔔 إطلاق تنبيه الطلب المتكامل (صوت + اهتزاز + إشعار شاشة القفل والخلفية)
  // =========================================================================
  triggerBackgroundAlert(order, customTitle, customBody) {
    // 1. عزف الصوت القوي
    this.playDriverAlert();

    // 2. اهتزاز الهاتف
    this.vibrate([400, 150, 400, 150, 600]);

    // 3. إرسال إشعار النظام عبر الـ Service Worker (يظهر فوق الخرائط وفي شاشة القفل)
    const orderId = order?.id || '';
    const title = customTitle || `🔔 سَنَد: وصلك طلب مسند جديد #${orderId}`;
    const body = customBody || (order 
      ? `العميل: ${order.customerName || 'عميل سَنَد'} | العنوان: ${order.customerAddress || 'المنطقة الشرقية'} | المبلغ: ${order.totalAmount || 0} ر.س`
      : 'شحنة جديدة جاهزة للاستلام والتوصيل الميداني');

    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options: {
              body,
              tag: 'sanad-order-' + (orderId || Date.now()),
              renotify: true,
              data: { orderId }
            }
          });
        } else if (window.sanadSwRegistration) {
          window.sanadSwRegistration.showNotification(title, {
            body,
            icon: '/sanad-express-logo.jpg',
            badge: '/sanad-express-logo.jpg',
            vibrate: [400, 150, 400, 150, 600],
            tag: 'sanad-order-' + (orderId || Date.now()),
            renotify: true,
            requireInteraction: true,
            data: { orderId }
          }).catch(() => {});
        }
      }
    } catch (e) {}

    // 4. النطق الصوتي للمندوب
    setTimeout(() => {
      this.speakArabic(`سَنَد: وصلك طلب جديد، ${order?.customerName ? 'للعميل ' + order.customerName : ''}`);
    }, 1200);
  }

  // =========================================================================
  // 1. نغمة هوية سَنَد الرسمية (The SANAD Signature Sonic Brand Logo)
  // C5 -> E5 -> G5 -> C6 مع هرمونيك بلوري دافئ
  // =========================================================================
  playSanadBrand() {
    if (!this.enabled) return;
    this.init();

    // تشغيل ملف الـ WAV المسبق لدعم الخلفية
    if (this.brandAudio) {
      try {
        this.brandAudio.currentTime = 0;
        this.brandAudio.play().catch(() => {});
      } catch (e) {}
    }

    // تعزيز بالعزف اللحظي عبر Web Audio API
    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      const sanadMotif = [
        { freq: 523.25, time: 0.00, dur: 0.35, type: 'sine', gain: 0.28 },
        { freq: 659.25, time: 0.12, dur: 0.38, type: 'triangle', gain: 0.32 },
        { freq: 783.99, time: 0.24, dur: 0.45, type: 'sine', gain: 0.35 },
        { freq: 1046.50, time: 0.38, dur: 0.85, type: 'sine', gain: 0.42 },
        { freq: 2093.00, time: 0.38, dur: 0.90, type: 'sine', gain: 0.15 }
      ];

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(130.81, now);
      bassOsc.frequency.exponentialRampToValueAtTime(65.41, now + 0.5);
      bassGain.gain.setValueAtTime(0.25, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.6);

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
    } catch (e) {}
  }

  // =========================================================================
  // 2. رنين تنبيه المندوب أثناء القيادة الميدانية (SANAD Driver Road Dispatch Siren)
  // رنين عالي النفاذية يخترق الضوضاء ومجرب للعمل حتى في الخلفية
  // =========================================================================
  playDriverAlert() {
    if (!this.enabled) return;
    this.init();

    // 1. تشغيل ملف الـ WAV المخصص (مضمون حتى في الخلفية وأثناء استخدام تطبيقات أخرى)
    if (this.alertAudio) {
      try {
        this.alertAudio.currentTime = 0;
        this.alertAudio.play().catch(() => {});
      } catch (e) {}
    }

    // 2. اهتزاز الهاتف
    this.vibrate([400, 150, 400, 150, 600]);

    // 3. دعم التوليد المباشر عبر Web Audio API
    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      const roadNotes = [
        { f: 880.00, t: 0.00, d: 0.12, type: 'triangle', g: 0.5 },
        { f: 1174.66, t: 0.14, d: 0.14, type: 'triangle', g: 0.55 },
        { f: 1396.91, t: 0.30, d: 0.22, type: 'sine', g: 0.6 },
        { f: 880.00, t: 0.60, d: 0.12, type: 'triangle', g: 0.5 },
        { f: 1174.66, t: 0.74, d: 0.14, type: 'triangle', g: 0.55 },
        { f: 1760.00, t: 0.90, d: 0.45, type: 'sine', g: 0.65 }
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
    } catch (e) {}
  }

  // صوت وصول طلب جديد للمنصة
  playOrderAssigned() {
    this.playSanadBrand();
  }

  // =========================================================================
  // 3. نغمة تأكيد التسليم وإثبات الشحنة بنجاح (SANAD Delivery Success & POD)
  // =========================================================================
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    this.vibrate([150, 80, 250]);

    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      const chordNotes = [
        { f: 440.00, t: 0.00, d: 0.35 },
        { f: 554.37, t: 0.08, d: 0.40 },
        { f: 659.25, t: 0.16, d: 0.45 },
        { f: 880.00, t: 0.24, d: 0.65 },
        { f: 1760.00, t: 0.32, d: 0.80 }
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
    } catch (e) {}
  }

  // =========================================================================
  // 4. نغمة توريد الكاش والخزينة والتحصيل المالي (SANAD Cash Vault Chime)
  // =========================================================================
  playCashRegister() {
    if (!this.enabled) return;
    this.init();
    this.vibrate([100, 50, 100]);

    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

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
    } catch (e) {}
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
