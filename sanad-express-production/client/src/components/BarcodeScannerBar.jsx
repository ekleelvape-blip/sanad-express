import React, { useState } from 'react';
import { Barcode, Search, CheckCircle, Package, Truck, AlertTriangle, ArrowRight } from 'lucide-react';

export default function BarcodeScannerBar({ onProcessScan, drivers }) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null);

  const handleScanSubmit = async (e, action = 'pickup') => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/orders/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcodeInput.trim(), action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'تم تحديث الشحنة ' + data.order.id + ' بنجاح!' });
        setBarcodeInput('');
        if (onProcessScan) onProcessScan(data.order);
      } else {
        setMessage({ type: 'error', text: data.error || 'فشلت معالجة الباركود' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 font-['Cairo',sans-serif]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Barcode className="w-5 h-5 text-emerald-400" />
          <span>محطة مسح الباركود السريع (سند إكسبريس):</span>
        </div>
        <span className="text-[10px] text-slate-400">يدعم القارئ الليزري أو الإدخال اليدوي المباشر</span>
      </div>
      <form onSubmit={(e) => handleScanSubmit(e, 'pickup')} className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[240px] relative">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="امسح باركود الشحنة (مثال: SND-282288)..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500 outline-none font-mono"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={() => handleScanSubmit(null, 'pickup')}
          disabled={loading || !barcodeInput.trim()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Package className="w-3.5 h-3.5" />
          <span>استلام من الفرع</span>
        </button>
        <button
          type="button"
          onClick={() => handleScanSubmit(null, 'out_for_delivery')}
          disabled={loading || !barcodeInput.trim()}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>خروج للتوصيل</span>
        </button>
        <button
          type="button"
          onClick={() => handleScanSubmit(null, 'delivered')}
          disabled={loading || !barcodeInput.trim()}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>تسليم وتحصيل</span>
        </button>
      </form>
      {message && (
        <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-red-950/60 text-red-300 border border-red-800'}`}
        >
          <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}