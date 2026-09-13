// أدوات ومحرك ضبط طابعات البوالص ومعايرة العداد والورق لمنظومة سَنَد
// يدعم: طابعة الملصقات الحرارية 4x6 (100x150 مم) + طابعة A4 المكتبية (كاملة أو 2 في 1) + طابعة الرول 80 مم

export const PRINTER_TYPES = {
  THERMAL: 'thermal', // طابعة ملصقات حرارية 4x6 بوصة (100x150 مم)
  A4: 'a4',           // طابعة مكتبية ورق A4 (210x297 مم)
  POS80: 'pos80'      // طابعة فواتير ورول حراري 80 مم
};

export const A4_LAYOUTS = {
  FULL: 'full',       // صفحة A4 كاملة مفصلة
  SPLIT_2IN1: 'split_2in1' // بوليصتين على صفحة A4 واحدة (توفير 50% من الورق)
};

export const DEFAULT_PRINTER_CONFIG = {
  defaultPrinterType: PRINTER_TYPES.THERMAL,
  thermalCopies: 1,        // العداد الافتراضي للحراري: 1 ملصق لكل طرد
  a4Copies: 1,             // العداد الافتراضي لـ A4: 1 أو 2 (نسخة العميل + نسخة المتجر)
  a4Layout: A4_LAYOUTS.FULL,
  thermalMarginOffset: 0,  // إزاحة الهامش بالمليمتر (0, +2, -2)
  autoPackageCounter: true,// تفعيل عداد الكراتين التلقائي (طرد 1/1، 1/2...)
  darkDpiOptimization: true, // تباين أسود نقي 100% للباركود
  storeNameOnWaybill: 'سند إكسبريس SANAD EXPRESS',
  autoCloseAfterPrint: true
};

const STORAGE_KEY = 'sanad_printer_config_v2';

/**
 * استرجاع إعدادات الطابعة المحفوظة
 */
export function loadPrinterSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not load printer settings, using defaults', e);
  }
  return { ...DEFAULT_PRINTER_CONFIG };
}

/**
 * حفظ إعدادات الطابعة في التخزين الدائم
 */
export function savePrinterSettings(newSettings) {
  try {
    const current = loadPrinterSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save printer settings', e);
    return DEFAULT_PRINTER_CONFIG;
  }
}

/**
 * إنشاء كود CSS المتطابق مع نوع الطابعة المحددة
 */
export function getPrinterCss(printerType = PRINTER_TYPES.THERMAL, a4Layout = A4_LAYOUTS.FULL, marginOffset = 0) {
  if (printerType === PRINTER_TYPES.A4) {
    if (a4Layout === A4_LAYOUTS.SPLIT_2IN1) {
      // بوليصتان على ورقة A4 واحدة (2 في 1)
      return `
        @page {
          size: A4 portrait;
          margin: 5mm 6mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 210mm;
          background: #ffffff !important;
          color: #000000 !important;
        }
        .waybill-print-sheet {
          width: 196mm !important;
          height: 284mm !important;
          max-height: 286mm !important;
          margin: 0 auto !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          page-break-after: always !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          background: #ffffff !important;
        }
        .waybill-print-sheet:last-child {
          page-break-after: auto !important;
        }
        .a4-half-waybill-card {
          height: 137mm !important;
          max-height: 138mm !important;
          box-sizing: border-box !important;
          border: 1.5px dashed #000000 !important;
          padding: 3.5mm !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          background: #ffffff !important;
        }
        .a4-cut-separator {
          height: 6mm !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 9px !important;
          font-weight: bold !important;
          color: #333333 !important;
          border-top: 1.5px dashed #555555 !important;
          margin: 1mm 0 !important;
        }
      `;
    }

    // ورقة A4 كاملة
    return `
      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 210mm;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .waybill-print-sheet {
        width: 194mm !important;
        height: 280mm !important;
        max-height: 282mm !important;
        margin: 0 auto !important;
        padding: 4mm !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        page-break-after: always !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        background: #ffffff !important;
      }
      .waybill-print-sheet:last-child {
        page-break-after: auto !important;
      }
      #waybill-a4-print-area {
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
    `;
  }

  if (printerType === PRINTER_TYPES.POS80) {
    // رول حراري صغير 80 مم
    return `
      @page {
        size: 80mm auto;
        margin: 2mm 0;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Cairo', 'Tajawal', sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 80mm;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .waybill-print-sheet {
        width: 76mm !important;
        margin: 0 auto !important;
        padding: 2mm !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        page-break-after: always !important;
      }
      .waybill-print-sheet:last-child {
        page-break-after: auto !important;
      }
    `;
  }

  // الافتراضي: طابعة ملصقات حرارية 4x6 بوصة (100x150 مم) - منع خروج الصفحة الفارغة تماماً
  const sidePad = Math.max(1, 3 + Number(marginOffset || 0));
  return `
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Cairo', 'Tajawal', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100mm;
      height: 150mm;
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .waybill-print-sheet {
      width: 100mm !important;
      max-width: 100mm !important;
      height: 150mm !important;
      max-height: 150mm !important;
      margin: 0 !important;
      padding: 3mm ${sidePad}mm 2.5mm ${sidePad}mm !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      page-break-inside: avoid !important;
      page-break-after: always !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      background: #ffffff !important;
    }
    .waybill-print-sheet:last-child {
      page-break-after: auto !important;
    }
    #thermal-print-area {
      width: 100% !important;
      height: 100% !important;
      max-height: 144mm !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: hidden !important;
    }
  `;
}

/**
 * تنفيذ عملية الطباعة في إطار مخفي يضمن مطابقة الأبعاد والعداد
 */
export function executeIframePrint({ pagesHtml, printerType, a4Layout, marginOffset, title = 'بوليصة شحن سند' }) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const css = getPrinterCss(printerType, a4Layout, marginOffset);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve(true);
      }, 1500);
    }, 450);
  });
}
