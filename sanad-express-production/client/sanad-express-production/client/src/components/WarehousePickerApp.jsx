import React, { useState } from 'react';
import { Box, CheckSquare, Square, Printer, CheckCircle2, Clock, Barcode, ArrowRight, User, Package, AlertCircle, Sparkles } from 'lucide-react';
import WaybillModal from './WaybillModal';
import { sound } from '../utils/sound';

export default function WarehousePickerApp({ orders, branches, selectedBranch, onRefresh }) {
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState(null);
  const [pickerName, setPickerName] = useState('أحمد فني التجهيز');
  const [checkedItems, setCheckedItems] = useState({});

  const filteredOrders = orders.filter(o => {
    const matchBranch = selectedBranch === 'all' || o.branchId === selectedBranch;
    return matchBranch && o.status !== 'delivered';
  });

  const handleToggleItem = (orderId, itemIdx) => {
    const key = orderId + '-' + itemIdx;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdvanceStage = async (order, nextStage) => {
    try {
      const res = await fetch('/api/orders/' + order.id + '/fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nextStage,
          pickerName: pickerName,
          checked: true
        })
      });
      if (res.ok) {
        sound.playSuccess();
        if (nextStage === 'packaged') {
          setSelectedWaybillOrder(order);
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error updating fulfillment:', err);
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'picking':
        return <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-bold flex items-center gap-1 animate-pulse"><span>🧺</span> جاري تحضير الأصناف</span>;
      case 'packing':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold flex items-center gap-1"><span>📦</span> جاري التعبئة والتشييك</span>;
      case 'packaged':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold flex items-center gap-1"><span>🏷️</span> تم التغليف وطباعة البوليصة</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold"><span>⏳</span> بانتظار بدء التحضير</span>;
    }
  };

  return (
    <div className="space-y-6 font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-[#0f1b23] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/sanad-express-logo.jpg" alt="سند إكسبريس" className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-emerald-950/60 border border-emerald-500/30 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100">محطة التجهيز والمستودع الذكي - سند إكسبريس</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">Fulfillment Flow</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              رحلة التجهيز الدقيقة للطلبات: تحضير من الرف ⬅️ تعبئة بالكرتون ⬅️ تشييك ومطابقة ⬅️ تغليف وطباعة البوليصة ⬅️ تسليم للمندوب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
          <User className="w-4 h-4 text-cyan-400 mr-1" />
          <span className="text-slate-400 font-bold">المسؤول:</span>
          <input
            type="text"
            value={pickerName}
            onChange={(e) => setPickerName(e.target.value)}
            className="bg-transparent text-slate-200 font-bold outline-none border-b border-cyan-800 px-1 text-xs w-36"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map(order => {
          const branch = branches.find(b => b.id === order.branchId);
          const fulfillment = order.fulfillment || { stage: 'pending_prep' };
          const trackingId = order.id.startsWith('SND-') ? order.id : 'SND-' + (order.id.replace(/\D/g, '') || '282288');
          const items = order.items || [{ name: 'شحنة منتجات متنوعة', qty: 1 }];

          return (
            <div key={order.id} className="bg-[#0f1b23] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-950 text-cyan-400 border border-slate-800">{trackingId}</span>
                    <div className="text-[11px] text-slate-400 font-bold mt-1">{branch ? branch.name : ''}</div>
                  </div>
                  {getStageBadge(fulfillment.stage)}
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-3 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{order.customerName}</span>
                    <span className="font-mono text-emerald-400">{order.totalAmount} ر.س</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{order.customerAddress}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>الأصناف المطلوب تحضيرها من الرفوف:</span>
                    <span className="text-[10px] text-cyan-400 font-mono">{items.length} صنف</span>
                  </div>
                  <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto text-xs">
                    {items.map((item, idx) => {
                      const isChecked = checkedItems[order.id + '-' + idx] || fulfillment.stage === 'packaged';
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleItem(order.id, idx)}
                          className={'flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ' + (isChecked ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800')}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" /> : <Square className="w-4 h-4 text-slate-500 shrink-0" />}
                            <span className={'truncate ' + (isChecked ? 'line-through opacity-80' : '')}>{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">×{item.qty}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                {(!fulfillment.stage || fulfillment.stage === 'pending_prep') && (
                  <button
                    onClick={() => handleAdvanceStage(order, 'picking')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-950/40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>1. ابدأ تحضير الطلب من الرف</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {fulfillment.stage === 'picking' && (
                  <button
                    onClick={() => handleAdvanceStage(order, 'packing')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-950/40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>2. تعبئة بالكرتون والتشييك</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {fulfillment.stage === 'packing' && (
                  <button
                    onClick={() => handleAdvanceStage(order, 'packaged')}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>3. اعتماد التغليف وطباعة البوليصة 4×6</span>
                  </button>
                )}

                {fulfillment.stage === 'packaged' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedWaybillOrder(order)}
                      className="flex-1 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>إعادة طباعة البوليصة</span>
                    </button>
                    <div className="flex items-center px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-bold">
                      <span>جاهز للمندوب ✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedWaybillOrder && (
        <WaybillModal
          order={selectedWaybillOrder}
          branch={branches.find(b => b.id === selectedWaybillOrder.branchId)}
          onClose={() => setSelectedWaybillOrder(null)}
        />
      )}
    </div>
  );
}