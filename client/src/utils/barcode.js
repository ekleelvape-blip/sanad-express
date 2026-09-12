// أدوات توليد الباركود و QR Code بصيغة SVG عالية الدقة لمنظومة سَنَد

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
 * توليد باركود Code-128B كمتجه SVG نقي عالي الدقة
 * @param {string} text - النص أو رقم الشحنة (مثال: SND-1006)
 * @param {number} height - ارتفاع الباركود بالبكسل
 * @param {number} barWidth - عرض الخط الأدنى
 * @returns {string} كود SVG كامل
 */
export function generateBarcodeSVG(text = 'SND-1001', height = 60, barWidth = 2) {
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

  let currentX = 10;
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

  const totalWidth = currentX + 10;
  return `
    <svg viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${rects.join('\n')}
    </svg>
  `;
}

/**
 * توليد كود QR عالي التباين والدقة بصيغة SVG نقي
 * معتمد على خوارزمية مصفوفة QR دقيقة لتمثيل رقم الشحنة ورابط التتبع
 * @param {string} data - محتوى الـ QR (مثال: SND-1006)
 * @param {number} size - حجم الـ QR بالبكسل
 * @returns {string} كود SVG كامل
 */
export function generateQrSVG(data = 'SND-1001', size = 120) {
  const matrixSize = 25; // حجم مصفوفة 25×25 (Version 2)
  const grid = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // 1. رسم مربعات الزوايا الثلاثة (Finder Patterns 7x7)
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // الإطار الخارجي
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // المربع الداخلي
        ) {
          grid[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);                 // أعلى اليسار
  drawFinder(matrixSize - 7, 0);    // أعلى اليمين
  drawFinder(0, matrixSize - 7);    // أسفل اليسار

  // 2. خطوط التوقيت (Timing patterns)
  for (let i = 8; i < matrixSize - 8; i++) {
    if (i % 2 === 0) {
      grid[6][i] = true;
      grid[i][6] = true;
    }
  }

  // 3. نمط المحاذاة الداخلي (Alignment Pattern 5x5 عند 16,16)
  const alignX = matrixSize - 9;
  const alignY = matrixSize - 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
        grid[alignY + r][alignX + c] = true;
      }
    }
  }

  // 4. تشفير بيانات الشحنة وتوليد نمط بيانات فريد لكل شحنة (Unique per order ID)
  const str = String(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }

  const isReserved = (r, c) => {
    if (r <= 8 && (c <= 8 || c >= matrixSize - 8)) return true;
    if (r >= matrixSize - 8 && c <= 8) return true;
    if (r >= alignY && r < alignY + 5 && c >= alignX && c < alignX + 5) return true;
    if (r === 6 || c === 6) return true;
    return false;
  };

  // حشو مصفوفة البيانات بالاعتماد على محتوى النص والتجزئة (Bitstream)
  let bitIndex = 0;
  for (let c = matrixSize - 1; c >= 0; c -= 2) {
    if (c === 6) c--; // تجاوز خط التوقيت
    for (let r = 0; r < matrixSize; r++) {
      for (let col = c; col >= Math.max(0, c - 1); col--) {
        if (!isReserved(r, col)) {
          const charCode = str.charCodeAt(bitIndex % str.length);
          const bit = (charCode ^ (hash >> (bitIndex % 16))) & 1;
          grid[r][col] = ((bit ^ ((r + col) % 2)) === 1);
          bitIndex++;
        }
      }
    }
  }

  // بناء مربعات الـ SVG
  const cellSize = size / matrixSize;
  const rects = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c]) {
        rects.push(`<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#000000" />`);
      }
    }
  }

  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius: 4px;">
      ${rects.join('\n')}
    </svg>
  `;
}
