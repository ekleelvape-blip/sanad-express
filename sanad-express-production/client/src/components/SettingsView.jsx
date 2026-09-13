import React, { useState, useEffect } from 'react';
import { 
  Settings, Sliders, ShieldCheck, CheckCircle2, Save, Cpu, DollarSign, Volume2, VolumeX, Play, Music, Radio, 
  MapPin, Printer, Tag, FileText, Scissors, AlertCircle, Sparkles, Check
} from 'lucide-react';
import DeliveryPricingView from './DeliveryPricingView';
import { 
  PRINTER_TYPES, A4_LAYOUTS, loadPrinterSettings, 
  savePrinterSettings, executeIframePrint 
} from '../utils/printerConfig';
import { generateBarcodeSVG, generateQrSVG } from '../utils/barcode';
import { sound } from '../utils/sound';

export default function SettingsView({ branches, initialSubTab = 'rules' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'rules' | 'pricing' | 'printers'
  
  // قواعد الإسناد
  const [selfAssign, setSelfAssign] = useState(true);
  const [readyOnly, setReadyOnly] = useState(true);
  const [reassignAfterDelay, setReassignAfterDelay] = useState(true);
  const [saved, setSaved] = useState(false);

  // إعدادات الطابعات والبوالص
  const [printerConfig, setPrinterConfig] = useState(loadPrinterSettings);
  const [printerSaved, setPrinterSaved] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  
  // إعدادات الهوية الصوتية والتنبيهات لسَنَد
  const [audioEnabled, setAudioEnabled] = useState(sound.enabled);
  const [voiceEnabled, setVoiceEnabled] = useState(sound.voiceEnabled);
  const [volumeLevel, setVolumeLevel] = useState(sound.volume);
  const [playingSoundKey, setPlayingSoundKey] = useState(null);
  const [audioSaved, setAudioSaved] = useState(false);

  const previewSound = (key) => {
    setPlayingSoundKey(key);
    if (key === 'brand') sound.playSanadBrand();
    else if (key === 'dispatch') sound.playDriverAlert();
    else if (key === 'success') sound.playSuccess();
    else if (key === 'cash') sound.playCashRegister();
    else if (key === 'voice') sound.speakArabic('سَنَد للخدمات اللوجستية: تم استلام وتحديث الشحنة بنجاح');
    setTimeout(() => setPlayingSoundKey(null), 1800);
  };

  const handleSaveAudioSettings = (e) => {
    e?.preventDefault();
    sound.setAudioSettings({
      enabled: audioEnabled,
      voiceEnabled,
      volume: volumeLevel
    });
    setAudioSaved(true);
    sound.playSanadBrand();
    setTimeout(() => setAudioSaved(false), 2500);
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSaveRules = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSavePrinterConfig = (e) => {
    e?.preventDefault();
    const updated = savePrinterSettings(printerConfig);
    setPrinterConfig(updated);
    setPrinterSaved(true);
    setTimeout(() => setPrinterSaved(false), 2500);
  };

  // تشغيل طباعة تجريبية لمعايرة الطابعة والتأكد من مطابقة المقاس والعداد
  const handleTestPrint = async (type) => {
    setIsTestPrinting(true);
    try {
      const isThermal = type === PRINTER_TYPES.THERMAL;
      const testCode = 'TEST-' + Math.floor(1000 + Math.random() * 9000);
      const testDate = new Date().toLocaleString('ar-SA');

      let pagesHtml = '';

      if (isThermal) {
        // ملصق حراري تجريبي 4x6 (100x150 مم)
        const labelHtml = `
          <div style="border: 2px solid #000; padding: 12px; height: 144mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: right; font-family: 'Cairo', sans-serif;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 900;">سند SANAD</h2>
                <div style="font-size: 11px; color: #555;">ملصق اختبار معايرة الطابعة الحرارية</div>
              </div>
              <div style="font-size: 26px; font-weight: 900; font-family: monospace;">TEST-4X6</div>
            </div>

            <div style="text-align: center; margin: 8px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">${generateBarcodeSVG(testCode, 60, 2)}</div>
                <div style="margin-right: 8px; border: 1px solid #000; padding: 2px;">${generateQrSVG(testCode, 75)}</div>
              </div>
              <div style="font-family: monospace; font-size: 12px; font-weight: bold; margin-top: 4px;">${testCode} • ${testDate}</div>
            </div>

            <div style="border: 1px solid #000; padding: 8px; font-size: 11px; background: #fafafa;">
              <div style="font-weight: bold; margin-bottom: 4px;">بيانات التحقق من المعايرة:</div>
              <div>• المقاس القياسي: <strong>100 مم × 150 مم (4×6 بوصة)</strong></div>
              <div>• الهامش: <strong>0 مم (Zero Margins) لمنع خروج ملصق فارغ</strong></div>
              <div>• تباين الباركود: <strong>100% أسود نقي (DPI Crisp Black)</strong></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; border: 2px solid #000; text-align: center; margin-top: 6px;">
              <div style="padding: 6px; border-left: 2px solid #000; background: #f0f0f0;">
                <div style="font-size: 10px; font-weight: bold;">عداد الكراتين (الطرود)</div>
                <div style="font-size: 20px; font-weight: 900; font-family: monospace;">1/1</div>
              </div>
              <div style="padding: 6px;">
                <div style="font-size: 10px; font-weight: bold;">حالة الطباعة</div>
                <div style="font-size: 14px; font-weight: 900; color: #000;">ناجحة ومطابقة ✓</div>
              </div>
            </div>

            <div style="border-top: 2px solid #000; padding-top: 6px; text-align: center; font-size: 10px; font-weight: bold;">
              إذا خرج هذا الملصق بدون أي صفحة فارغة إضافية، فالطابعة مضبوطة 100%
            </div>
          </div>
        `;
        pagesHtml = `<div class="waybill-print-sheet">${labelHtml}</div>`;
      } else {
        // صفحة A4 تجريبية
        const a4Html = `
          <div style="border: 2px solid #000; padding: 24px; min-height: 270mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: right; font-family: 'Cairo', sans-serif;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 900;">سند SANAD EXPRESS</h1>
                <div style="font-size: 13px; color: #555;">صفحة اختبار ومعايرة طابعة A4 المكتبية</div>
              </div>
              <div style="text-align: left;">
                <div style="font-size: 32px; font-weight: 900; font-family: monospace;">TEST-A4</div>
                <div style="font-size: 11px; font-family: monospace;">${testDate}</div>
              </div>
            </div>

            <div style="text-align: center; margin: 20px 0; border: 1px solid #000; padding: 16px; background: #fafafa; border-radius: 8px;">
              <div style="max-width: 500px; margin: 0 auto;">${generateBarcodeSVG(testCode, 70, 2.2)}</div>
              <div style="font-family: monospace; font-size: 14px; font-weight: 900; margin-top: 8px;">${testCode}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px;">
              <div style="border: 1px solid #000; padding: 12px; border-radius: 8px;">
                <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 6px;">معايير صفحة A4:</h3>
                <div>• العرض: <strong>210 مم</strong> • الارتفاع: <strong>297 مم</strong></div>
                <div>• الهوامش المعتمدة: <strong>6 مم إلى 8 مم</strong></div>
                <div>• التوافق: <strong>طابعات HP / Canon / Brother / Epson</strong></div>
              </div>
              <div style="border: 1px solid #000; padding: 12px; border-radius: 8px; background: #f9f9f9;">
                <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 6px;">حالة العداد:</h3>
                <div>• العداد المحدد: <strong>${printerConfig.a4Copies || 1} نسخة</strong></div>
                <div>• نمط التخطيط: <strong>${printerConfig.a4Layout === A4_LAYOUTS.SPLIT_2IN1 ? '2 في 1 (توفير 50%)' : 'صفحة A4 كاملة'}</strong></div>
              </div>
            </div>

            <div style="border: 2px solid #000; padding: 16px; text-align: center; margin-top: 20px; border-radius: 8px;">
              <div style="font-size: 18px; font-weight: 900;">✓ تمت المعايرة بنجاح تام</div>
              <div style="font-size: 12px; color: #555; margin-top: 4px;">إذا كانت هذه الصفحة محتواة بالكامل داخل ورقة واحدة بدون صفحة ثانية بيضاء، فالطابعة جاهزة للعمل.</div>
            </div>

            <div style="border-top: 2px solid #000; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
              <span>سند SANAD — منظومة التوصيل واللوجستيات</span>
              <span>www.sanad.sa</span>
            </div>
          </div>
        `;
        pagesHtml = `<div class="waybill-print-sheet">${a4Html}</div>`;
      }

      await executeIframePrint({
        pagesHtml,
        printerType: type,
        a4Layout: printerConfig.a4Layout,
        marginOffset: printerConfig.thermalMarginOffset || 0,
        title: `صفحة اختبار طباعة سند - ${type}`
      });
    } catch (e) {
      console.error('Test print error:', e);
    } finally {
      setIsTestPrinting(false);
    }
  };

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      
      {/* 1. الترويسة وأزرار التبويبات الثلاثة */}
      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>إعدادات النظام والتوصيل والطابعات - سَنَد</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ضبط ومطابقة طابعات البوالص (الحراري 4×6 و A4) ومعايرة العداد، وسياسات الإسناد والأسعار
          </p>
        </div>

        {/* أزرار التبديل السريعة داخل الإعدادات */}
        <div className="flex items-center gap-2 bg-[#080d16] p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs flex-wrap">
          
          <button
            type="button"
            onClick={() => setActiveSubTab('audio')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'audio'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>الهوية الصوتية والتنبيهات 🔔🎵</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('printers')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'printers'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>إعدادات الطابعات والعداد 🖨️</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rules')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>قواعد وسياسات التوصيل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pricing')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'pricing'
                ? 'bg-[#00d2d3] text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>أسعار التوصيل والمناطق</span>
          </button>

        </div>
      </div>

      {/* =========================================================================
          تبويب 1: إعدادات ومعايرة الطابعات والعداد (Printers & Counters Calibration)
          ========================================================================= */}
      {activeSubTab === 'printers' && (
        <div className="space-y-6">
          
          {/* الكروت الأربعة المتناسقة */}
          <form onSubmit={handleSavePrinterConfig} className="space-y-6 text-xs">
            
            {/* الكرت 1: نوع الطابعة الافتراضية المفضلة */}
            <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    🖨️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">نوع الطابعة النشطة والافتراضية للنظام</h3>
                    <p className="text-[11px] text-slate-400">حدد الطابعة الموصولة بجهازك لضبط الأبعاد ومنع خروج ملصقات فارغة</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-[10px] font-bold">
                  مطابقة تلقائية 100%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* خيار الطابعة الحرارية 4x6 */}
                <div
                  onClick={() => setPrinterConfig(prev => ({ ...prev, defaultPrinterType: PRINTER_TYPES.THERMAL }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    printerConfig.defaultPrinterType === PRINTER_TYPES.THERMAL
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-400" />
                      <span className="font-bold text-sm text-white">طابعة ملصقات حرارية (Thermal 4×6)</span>
                    </div>
                    {printerConfig.defaultPrinterType === PRINTER_TYPES.THERMAL && (
                      <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    مقاس <strong>100 مم × 150 مم (4×6 بوصة)</strong>. مخصصة لطابعات البوالص اللاصقة مثل Xprinter, Zebra, Phomemo, Rongta.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                    <span>✓ هوامش صفرية لمنع خروج ملصق فارغ</span>
                    <span>•</span>
                    <span>عداد نسخ افتراضي: 1 ملصق</span>
                  </div>
                </div>

                {/* خيار طابعة A4 المكتبية */}
                <div
                  onClick={() => setPrinterConfig(prev => ({ ...prev, defaultPrinterType: PRINTER_TYPES.A4 }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    printerConfig.defaultPrinterType === PRINTER_TYPES.A4
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <span className="font-bold text-sm text-white">طابعة مكتبية عادية (ورق A4 كامل)</span>
                    </div>
                    {printerConfig.defaultPrinterType === PRINTER_TYPES.A4 && (
                      <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    مقاس <strong>210 مم × 297 مم (A4)</strong>. مخصصة لطابعات الليزر والمكتبية مثل HP, Canon, Brother, Epson.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-cyan-300 font-bold">
                    <span>✓ بوليصة كاملة مع فاتورة وإقرار استلام</span>
                    <span>•</span>
                    <span>دعم نمط 2 في 1 الموفر</span>
                  </div>
                </div>
              </div>
            </div>

            {/* الكرت 2: ضبط العداد التلقائي (Automatic Counters Configuration) */}
            <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  🔢
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ضبط العداد التلقائي المتطابق مع الطابعة</h3>
                  <p className="text-[11px] text-slate-400">تحديد عدد النسخ الافتراضية وعداد الكراتين عند فتح أي بوليصة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* عداد نسخ الطابعة الحرارية */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <label className="font-bold text-slate-200 block text-xs">
                    عداد نسخ الطابعة الحرارية:
                  </label>
                  <select
                    value={printerConfig.thermalCopies || 1}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, thermalCopies: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl p-2.5 outline-none focus:border-purple-500"
                  >
                    <option value="1">1 نسخة (موصى به - ملصق واحد للكرتون)</option>
                    <option value="2">2 نسختين لكل كرتون</option>
                    <option value="3">3 نسخ</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    في الطابعات الحرارية يكفي ملصق واحد يوضع على الكرتون.
                  </span>
                </div>

                {/* عداد نسخ طابعة A4 */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <label className="font-bold text-slate-200 block text-xs">
                    عداد نسخ طابعة A4 المكتبية:
                  </label>
                  <select
                    value={printerConfig.a4Copies || 1}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, a4Copies: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl p-2.5 outline-none focus:border-cyan-500"
                  >
                    <option value="1">1 نسخة (الأصل فقط)</option>
                    <option value="2">2 نسخ (نسخة العميل + نسخة المتجر/الأرشيف)</option>
                    <option value="3">3 نسخ (عميل + متجر + سائق)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    عند اختيار نسختين يُكتب على الأولى نسخة العميل وعلى الثانية الأرشيف.
                  </span>
                </div>

                {/* نمط تخطيط ورقة A4 */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <label className="font-bold text-slate-200 block text-xs">
                    تخطيط صفحة A4 الافتراضي:
                  </label>
                  <select
                    value={printerConfig.a4Layout || A4_LAYOUTS.FULL}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, a4Layout: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl p-2.5 outline-none focus:border-cyan-500"
                  >
                    <option value={A4_LAYOUTS.FULL}>صفحة A4 كاملة مفصلة (Full A4)</option>
                    <option value={A4_LAYOUTS.SPLIT_2IN1}>2 في 1 توفيري (بوليصتان في ورقة A4)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    نمط 2 في 1 يوفر 50% من الورق لطابعات الليزر.
                  </span>
                </div>
              </div>

              {/* خيار عداد الكراتين التلقائي */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200 text-xs">تفعيل عداد الكراتين والطرود التلقائي (Multi-Package Counter)</div>
                  <div className="text-[11px] text-slate-400">عندما تزيد عدد الكراتين عن 1، يُطبع ملصق لكل كرتون مع الترقيم (طرد 1 من 2، 2 من 2)</div>
                </div>
                <input
                  type="checkbox"
                  checked={printerConfig.autoPackageCounter !== false}
                  onChange={(e) => setPrinterConfig(prev => ({ ...prev, autoPackageCounter: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* الكرت 3: معايرة الهوامش ودقة الطباعة (DPI & Margin Calibration) */}
            <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">معايرة الهوامش ومنع خروج الملصق الفارغ</h3>
                  <p className="text-[11px] text-slate-400">ضبط إزاحة الهامش الأفقي لملصقات الشحن الحرارية لضمان دقة القص والحواف</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">معايرة الهامش الأفقي للحراري (Offset):</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrinterConfig(prev => ({ ...prev, thermalMarginOffset: 0 }))}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        (printerConfig.thermalMarginOffset || 0) === 0
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      0 مم (قياسي)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterConfig(prev => ({ ...prev, thermalMarginOffset: 2 }))}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        printerConfig.thermalMarginOffset === 2
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      +2 مم (أمان)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterConfig(prev => ({ ...prev, thermalMarginOffset: -1 }))}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        printerConfig.thermalMarginOffset === -1
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      -1 مم (حواف ضيقة)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">اسم المنشأة الافتراضي على البوليصة:</label>
                  <input
                    type="text"
                    value={printerConfig.storeNameOnWaybill || 'سند إكسبريس SANAD EXPRESS'}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, storeNameOnWaybill: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-cyan-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* أزرار الحفظ وبدء الاختبار الفعلي للطابعة */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-300 text-xs">اختبار المعايرة الميداني:</span>
                
                {/* زر طباعة ملصق اختبار حراري 4x6 */}
                <button
                  type="button"
                  onClick={() => handleTestPrint(PRINTER_TYPES.THERMAL)}
                  disabled={isTestPrinting}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="طباعة ملصق حراري تجريبي للتأكد من انطباق المقاس 100x150 وعدم خروج ملصق فارغ"
                >
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>🖨️ طباعة ملصق اختبار حراري 4×6</span>
                </button>

                {/* زر طباعة صفحة اختبار A4 */}
                <button
                  type="button"
                  onClick={() => handleTestPrint(PRINTER_TYPES.A4)}
                  disabled={isTestPrinting}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="طباعة صفحة A4 تجريبية للتأكد من هوامش الطابعة المكتبية"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🖨️ طباعة صفحة اختبار A4</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {printerSaved && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                    <Check className="w-4 h-4" />
                    <span>تم حفظ الإعدادات بنجاح!</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
                >
                  حفظ إعدادات الطابعات والعداد
                </button>
              </div>
            </div>

          </form>

        </div>
      )}

      {/* =========================================================================
          تبويب 2: أسعار التوصيل والمناطق (DeliveryPricingView)
          ========================================================================= */}
      {activeSubTab === 'pricing' && (
        <DeliveryPricingView branches={branches} />
      )}

      {/* =========================================================================
          تبويب 3: قواعد وسياسات التوصيل (Rules)
          ========================================================================= */}
      {activeSubTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6 max-w-2xl text-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">قواعد التوصيل والإسناد للمناديب:</h3>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selfAssign}
                  onChange={(e) => setSelfAssign(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-200 text-xs">الإسناد الذاتي للمندوب (Self-Pickup)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">يقدر السائق يسند الطلبات لنفسه من المستودع إذا مسح الباركود حقها</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readyOnly}
                  onChange={(e) => setReadyOnly(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-200 text-xs">الإسناد بعد جاهزية الطلب فقط</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">لا يمكن للمندوب استلام الشحنة إلا بعد اكتمال التغليف وإصدار البوليصة</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reassignAfterDelay}
                  onChange={(e) => setReassignAfterDelay(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-200 text-xs">إعادة الإسناد لنفس السائق بعد التأجيل</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">إعادة إسناد الطلبات المؤجلة لنفس السائق تلقائياً عند استئناف التوصيل</div>
                </div>
              </label>
            </div>
            
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 pt-2">سياسة مزامنة الفروع:</h3>
            <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-800/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>مزامنة فروع (إكليل الدمام + فيب الشرق + متجر إكليل فيب)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                مفعلة تلقائياً: أي مندوب يتم تسجيله في أي من هذه الفروع الثلاثة يتزامن تلقائياً ويصبح متاحاً للفرعين الآخرين بدون أي تدخل يدوي، مع استقلالية تامة لفرع الجبيل.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              {saved ? '✓ تم حفظ الإعدادات' : 'حفظ إعدادات النظام'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
