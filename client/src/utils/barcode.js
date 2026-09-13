// أدوات توليد الباركود و QR Code بصيغة SVG القياسية العالمية المعتمدة لمنظومة سَنَد
import QRCode from 'qrcode';

/**
 * جدول تشفير Code-128 (Subset B) القياسي للشحنات اللوجستية
 */
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_B = 104;
const STOP = 106;

/**
 * توليد باركود Code-128B كمتجه SVG قياسي معتمد عالي التباين
 * يحتوي على منطقة الأمان البيضاء (Quiet Zone) وخلفية نقية لقراءة فورية من مسافة
 * @param {string} text - النص أو رقم الشحنة (مثال: SND-1006)
 * @param {number} height - ارتفاع الباركود بالبكسل
 * @param {number} barWidth - عرض الخط الأدنى
 * @returns {string} كود SVG كامل
 */
export function generateBarcodeSVG(text = 'SND-1001', height = 65, barWidth = 2) {
  const clean = String(text || 'SND-1001').trim();
  const codes = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      codes.push(code);
      checkSum += code * (i + 1);
    }
  }

  codes.push(checkSum % 103);
  codes.push(STOP);

  const margin = 20; // 10x quiet zone required for barcode scanners
  let currentX = margin;
  const rects = [];

  codes.forEach(codeIdx => {
    const pattern = CODE128_PATTERNS[codeIdx];
    if (!pattern) return;
    for (let i = 0; i < pattern.length; i++) {
      const w = parseInt(pattern[i], 10) * barWidth;
      if (i % 2 === 0) {
        rects.push(`<rect x="${currentX}" y="0" width="${w}" height="${height}" fill="#000000" />`);
      }
      currentX += w;
    }
  });

  const totalWidth = currentX + margin;
  return `
    <svg viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff;">
      <rect width="100%" height="100%" fill="#ffffff" />
      ${rects.join('\n')}
    </svg>
  `;
}

/**
 * توليد كود QR قياسي معتمد عالمياً (ISO/IEC 18004) بصيغة SVG نقي
 * يحتوي على ترميز Reed-Solomon الحقيقي لتصحيح الأخطاء والقراءة الفورية من مسافة بعيدة
 * @param {string} data - محتوى الـ QR (مثال: SND-1006)
 * @param {number} size - حجم الـ QR بالبكسل
 * @returns {string} كود SVG كامل
 */
export function generateQrSVG(data = 'SND-1001', size = 120) {
  try {
    const cleanText = String(data || 'SND-1001').trim();
    const qr = QRCode.create(cleanText, { errorCorrectionLevel: 'M' });
    const modSize = qr.modules.size;
    const margin = 2;
    const totalGrid = modSize + margin * 2;
    const cellSize = size / totalGrid;

    const rects = [];
    for (let r = 0; r < modSize; r++) {
      for (let c = 0; c < modSize; c++) {
        if (qr.modules.get(r, c)) {
          const x = ((c + margin) * cellSize).toFixed(2);
          const y = ((r + margin) * cellSize).toFixed(2);
          const w = (cellSize + 0.05).toFixed(2);
          rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#000000" />`);
        }
      }
    }

    return `
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius: 4px;">
        <rect width="100%" height="100%" fill="#ffffff" />
        ${rects.join('')}
      </svg>
    `;
  } catch (err) {
    console.error('Error generating QR SVG:', err);
    return `<div style="width:${size}px;height:${size}px;background:#ffffff;"></div>`;
  }
}
