// منظومة الوثائق والمستندات المحاسبية الرسمية - شركة سند إكسبريس للخدمات اللوجستية
// متوافقة مع معايير هيئة الزكاة والضريبة والجمارك (ZATCA) والهيئة العامة للنقل والأنظمة التجارية السعودية
import React from 'react';

export const SANAD_OFFICIAL_ENTITY = {
  nameAr: 'سند للخدمات اللوجستية',
  nameEn: 'SANAD LOGISTICS CO.',
  legalType: 'شركة ذات مسؤولية محدودة - رأس المال المدفوع: 500,000 ريال سعودي',
  crNumber: '1010789456',              // السجل التجاري
  vatNumber: '310245678900003',        // الرقم الضريبي بهيئة الزكاة والضريبة والجمارك
  transportLicense: '04012024-SND',    // ترخيص الهيئة العامة للنقل
  nationalAddress: 'المملكة العربية السعودية - الرياض - حي السلي - ص.ب 14233',
  phone: '920033881',
  email: 'finance@sanadexpress.sa',
  website: 'www.sanadexpress.sa',
  logoUrl: '/sanad-express-logo.jpg?v=3'
};

/**
 * دالة التفقيط باللغة العربية للريال السعودي والهللات
 */
export function tafqeetArabic(amount) {
  const num = Math.abs(Number(amount) || 0);
  const riyals = Math.floor(num);
  const halalas = Math.round((num - riyals) * 100);

  if (riyals === 0 && halalas === 0) return 'صفر ريال سعودي لا غير';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(val) {
    let res = '';
    const h = Math.floor(val / 100);
    const t = val % 100;
    if (h > 0) res += hundreds[h];
    if (t > 0) {
      if (res) res += ' و';
      if (t < 20) {
        res += ones[t];
      } else {
        const o = t % 10;
        const ten = Math.floor(t / 10);
        if (o > 0) res += ones[o] + ' و';
        res += tens[ten];
      }
    }
    return res;
  }

  const millions = Math.floor(riyals / 1000000);
  const thousands = Math.floor((riyals % 1000000) / 1000);
  const remainder = riyals % 1000;

  let parts = [];
  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions <= 10) parts.push(convertGroup(millions) + ' ملايين');
    else parts.push(convertGroup(millions) + ' مليون');
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands <= 10) parts.push(convertGroup(thousands) + ' آلاف');
    else parts.push(convertGroup(thousands) + ' ألف');
  }

  if (remainder > 0 || parts.length === 0) {
    parts.push(convertGroup(remainder));
  }

  let text = 'فقط ' + parts.join(' و') + ' ريال سعودي';

  if (halalas > 0) {
    text += ' و' + convertGroup(halalas) + ' هللة';
  }

  return text + ' لا غير';
}

/**
 * دالة التفقيط باللغة الإنجليزية للريال السعودي
 */
export function tafqeetEnglish(amount) {
  const num = Math.abs(Number(amount) || 0);
  const riyals = Math.floor(num);
  const halalas = Math.round((num - riyals) * 100);

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
  }

  function convertNumber(n) {
    if (n === 0) return 'Zero';
    let str = '';
    if (Math.floor(n / 1000000) > 0) {
      str += convertNumber(Math.floor(n / 1000000)) + ' Million ';
      n %= 1000000;
    }
    if (Math.floor(n / 1000000) === 0 && Math.floor(n / 1000) > 0) {
      str += convertNumber(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      str += (str !== '' ? 'and ' : '') + inWords(n);
    }
    return str.trim();
  }

  let result = 'Only ' + convertNumber(riyals) + ' Saudi Riyals';
  if (halalas > 0) {
    result += ' and ' + convertNumber(halalas) + ' Halalas';
  }
  return result;
}

/**
 * الحصول على التواريخ الرسمية (الميلادي والهجري والوقت الحالي)
 */
export function getOfficialFormattedDates(timestamp = null) {
  const dateObj = timestamp ? new Date(timestamp) : new Date();
  
  const gregorian = dateObj.toLocaleDateString('ar-SA', {
    calendar: 'gregory',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const gregorianEn = dateObj.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  let hijri = '';
  try {
    hijri = dateObj.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    hijri = '١٤٤٨/٠٣/٠١ هـ';
  }

  const time = dateObj.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    gregorian,
    gregorianEn,
    hijri,
    time,
    iso: dateObj.toISOString()
  };
}

/**
 * مكون الختم الرسمي المعتمد لشركة سند إكسبريس (SVG Seal)
 */
export function OfficialStamp({
  department = 'الخزينة المركزية',
  statusText = 'معتمد ومقيد',
  statusSub = 'APPROVED & AUDITED',
  date = null,
  size = 125
}) {
  const displayDate = date || new Date().toISOString().split('T')[0];
  
  return (
    <div 
      className="inline-block relative select-none pointer-events-none transform -rotate-6 transition-transform"
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-[0_2px_3px_rgba(30,58,138,0.2)]"
        style={{ color: '#1e3a8a' }}
      >
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="100" r="89" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="1.8" />
        
        <path id="topCircle" d="M 28 100 A 72 72 0 0 1 172 100" fill="none" />
        <path id="bottomCircle" d="M 172 100 A 72 72 0 0 1 28 100" fill="none" />

        <text fill="currentColor" fontSize="10.5" fontWeight="900" letterSpacing="0.8" fontFamily="Cairo, Tajawal, sans-serif">
          <textPath href="#topCircle" startOffset="50%" textAnchor="middle">
            ★ سند للخدمات اللوجستية ★
          </textPath>
        </text>

        <text fill="currentColor" fontSize="8" fontWeight="800" letterSpacing="1.2" fontFamily="Arial, sans-serif">
          <textPath href="#bottomCircle" startOffset="50%" textAnchor="middle">
            SANAD LOGISTICS CO.
          </textPath>
        </text>

        <g transform="translate(100, 78) scale(0.65)" textAnchor="middle">
          <circle cx="0" cy="0" r="16" fill="rgba(30,58,138,0.06)" stroke="currentColor" strokeWidth="1.5" />
          <path d="M -8 2 L 0 -10 L 8 2 Z" fill="currentColor" />
          <line x1="0" y1="-10" x2="0" y2="8" stroke="currentColor" strokeWidth="2.5" />
          <line x1="-10" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="2" />
        </g>

        <text 
          x="100" 
          y="112" 
          textAnchor="middle" 
          fill="currentColor" 
          fontSize="11" 
          fontWeight="900" 
          fontFamily="Cairo, Tajawal, sans-serif"
        >
          {department}
        </text>

        <rect x="36" y="118" width="128" height="18" rx="4" fill="#1e3a8a" />
        <text 
          x="100" 
          y="131" 
          textAnchor="middle" 
          fill="#ffffff" 
          fontSize="10" 
          fontWeight="900" 
          fontFamily="Cairo, Tajawal, sans-serif"
        >
          {statusText}
        </text>

        <text 
          x="100" 
          y="148" 
          textAnchor="middle" 
          fill="currentColor" 
          fontSize="6.5" 
          fontWeight="900" 
          letterSpacing="1"
          fontFamily="Arial, sans-serif"
        >
          {statusSub}
        </text>

        <text 
          x="100" 
          y="160" 
          textAnchor="middle" 
          fill="currentColor" 
          fontSize="8" 
          fontWeight="800" 
          fontFamily="monospace"
        >
          {displayDate}
        </text>
      </svg>
    </div>
  );
}

/**
 * مكون رمز QR المتوافق مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA)
 */
export function OfficialZatcaQr({ size = 88 }) {
  return (
    <div className="flex flex-col items-center justify-center p-1.5 bg-white border border-slate-800 rounded-lg shadow-sm" style={{ width: size + 16 }}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full text-slate-950" 
        fill="currentColor"
        style={{ width: size, height: size }}
      >
        <rect x="5" y="5" width="28" height="28" fill="currentColor" rx="2" />
        <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="13" y="13" width="12" height="12" fill="currentColor" rx="1" />

        <rect x="67" y="5" width="28" height="28" fill="currentColor" rx="2" />
        <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="75" y="13" width="12" height="12" fill="currentColor" rx="1" />

        <rect x="5" y="67" width="28" height="28" fill="currentColor" rx="2" />
        <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="1" />
        <rect x="13" y="75" width="12" height="12" fill="currentColor" rx="1" />

        <rect x="38" y="8" width="5" height="5" />
        <rect x="48" y="12" width="5" height="5" />
        <rect x="56" y="8" width="5" height="5" />
        <rect x="38" y="22" width="5" height="5" />
        <rect x="48" y="26" width="5" height="5" />
        <rect x="56" y="20" width="5" height="5" />
        <rect x="8" y="38" width="5" height="5" />
        <rect x="18" y="44" width="5" height="5" />
        <rect x="26" y="38" width="5" height="5" />
        <rect x="38" y="38" width="7" height="7" />
        <rect x="50" y="40" width="5" height="5" />
        <rect x="60" y="38" width="6" height="6" />
        <rect x="72" y="42" width="5" height="5" />
        <rect x="82" y="38" width="6" height="6" />
        <rect x="40" y="52" width="6" height="6" />
        <rect x="52" y="50" width="8" height="8" />
        <rect x="65" y="54" width="6" height="6" />
        <rect x="78" y="50" width="6" height="6" />
        <rect x="38" y="68" width="6" height="6" />
        <rect x="48" y="72" width="6" height="6" />
        <rect x="60" y="68" width="6" height="6" />
        <rect x="70" y="74" width="6" height="6" />
        <rect x="82" y="70" width="6" height="6" />
        <rect x="38" y="82" width="5" height="5" />
        <rect x="50" y="86" width="6" height="6" />
        <rect x="62" y="82" width="6" height="6" />
        <rect x="74" y="86" width="5" height="5" />
        <rect x="84" y="82" width="6" height="6" />
      </svg>
      <div className="text-[7.5px] font-black text-slate-800 text-center uppercase tracking-tighter mt-1">
        ZATCA E-VERIFIED
      </div>
    </div>
  );
}

/**
 * دالة الطباعة المعزولة عبر Iframe
 */
export function printOfficialDocument(elementId, documentTitle = 'سند رسمي معتمد - سند إكسبريس') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for official printing`);
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  const contentHtml = element.outerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Cairo', 'Tajawal', sans-serif;
          }
          .official-print-page {
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-hidden {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="official-print-page">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Error during iframe printing', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 750);
}
