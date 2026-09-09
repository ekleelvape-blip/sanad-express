import React, { useState } from 'react';
import { Plus, UserCheck, Clock, MapPin, Phone, PackageCheck, AlertCircle, CheckCircle2, Edit3, RotateCcw, Printer, UserPlus, Users, FileText, Barcode, AlertTriangle } from 'lucide-react';
import WaybillModal from './WaybillModal';
import DriverManifestModal from './DriverManifestModal';
import BarcodeScannerBar from './BarcodeScannerBar';
import DeliveryExceptionModal from './DeliveryExceptionModal';
import { sound } from '../utils/sound';

export default function OrderDispatch({ orders, drivers, branches, selectedBranch, onAssignOrder, onCreateOrder, onRefresh }) {
  const [selectedDriverForOrder, setSelectedDriverForOrder] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [reassigningOrder, setReassigningOrder] = useState(null);
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState(null);
  const [manifestDriverId, setManifestDriverId] = useState(null);
  const [exceptionOrder, setExceptionOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    branchId: selectedBranch !== 'all' ? selectedBranch : 'branch-iklil-dammam',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    productDescription: '',
    totalAmount: '',
    paymentMethod: 'cash',
    driverCommission: 20,
    notes: ''
  });

  const [driverFormData, setDriverFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'تويوتا يارس',
    branchId: selectedBranch !== 'all' ? selectedBranch : 'branch-iklil-dammam'
  });

  const handleSubmitNewOrder = (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerAddress || !formData.totalAmount) {
      alert('يرجى ملء الحقول الإجبارية');
      return;
    }
    onCreateOrder({
      branchId: formData.branchId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone || '0500000000',
      customerAddress: formData.customerAddress,
      totalAmount: Number(formData.totalAmount),
      paymentMethod: formData.paymentMethod,
      driverCommission: Number(formData.driverCommission) || 20,
      notes: formData.notes,
      items: [{ name: formData.productDescription || 'شحنة متنوعة', qty: 1, price: Number(formData.totalAmount) }]
    });
    setFormData({
      branchId: selectedBranch !== 'all' ? selectedBranch : 'branch-iklil-dammam',
      customerName: '', customerPhone: '', customerAddress: '', productDescription: '', totalAmount: '', paymentMethod: 'cash', driverCommission: 20, notes: ''
    });
    setShowAddModal(false);
  };

  const handleSaveEditOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      const res = await fetch('/api/orders/' + editingOrder.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrder)
      });
      if (res.ok) {
        sound.playSuccess();
        setEditingOrder(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error editing order:', err);
    }
  };

  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!reassigningOrder || !reassigningOrder.newDriverId) return;
    try {
      const res = await fetch('/api/orders/' + reassigningOrder.order.id + '/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDriverId: reassigningOrder.newDriverId,
          reason: reassigningOrder.reason || 'إعادة إسناد لمندوب بديل'
        })
      });
      if (res.ok) {
        sound.playSuccess();
        setReassigningOrder(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error reassigning order:', err);
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (!driverFormData.name || !driverFormData.phone) return;
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverFormData)
      });
      const data = await res.json();
      if (res.ok) {
        sound.playSuccess();
        alert('تمت إضافة المندوب ' + data.driver.name + ' بنجاح وتمت مزامنته عبر فروع إكليل وفيب الشرق!');
        setShowAddDriverModal(false);
        setDriverFormData({ name: '', phone: '', vehicle: 'تويوتا يارس', branchId: selectedBranch !== 'all' ? selectedBranch : 'branch-iklil-dammam' });
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error creating driver:', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchBranch = selectedBranch === 'all' || o.branchId === selectedBranch;
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchBranch && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'unassigned':
        return <span className="px-2.5 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-800/60 text-xs font-bold flex items-center gap-1 animate-pulse"><span>🔴</span> شحنة جديدة</span>;
      case 'assigned':
        return <span className="px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 text-xs font-bold flex items-center gap-1"><span>🟣</span> مسندة للمندوب</span>;
      case 'picked_up':
        return <span className="px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 text-xs font-bold flex items-center gap-1"><span>📦</span> استلام من الفرع</span>;
      case 'in_transit':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-xs font-bold flex items-center gap-1"><span>🚗</span> في الطريق للعميل</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold flex items-center gap-1"><span>✅</span> تم التسليم</span>;
      case 'exception':
        return <span className="px-2.5 py-1 rounded-full bg-red-950/90 text-red-200 border border-red-700 text-xs font-bold flex items-center gap-1"><span>⚠️</span> تعثر التوصيل</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-['Cairo',sans-serif]">
      {/* شريط ماسح الباركود السريع لسند إكسبريس */}
      <BarcodeScannerBar onProcessScan={onRefresh} drivers={drivers} />

      {/* شريط الإجراءات ورأس لوحة الإسناد */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span>محطة التوزيع وإسناد الشحنات - سند إكسبريس</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إسناد وتوزيع الشحنات، طباعة بوالص الشحن الحرارية 4×6، استخراج المانيفست الميداني، ومسح الباركود
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* زر استخراج المانيفست للمندوب */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <select
              onChange={(e) => {
                if (e.target.value) setManifestDriverId(e.target.value);
              }}
              defaultValue=""
              className="bg-transparent text-slate-300 text-xs font-bold outline-none px-2 cursor-pointer"
            >
              <option value="">-- طباعة المانيفست لمندوب --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>بيان شحنات {d.name}</option>
              ))}
            </select>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>

          <button
            onClick={() => setShowAddDriverModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-purple-400" />
            <span>إضافة مندوب</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>شحنة إكسبريس جديدة</span>
          </button>
        </div>
      </div>

      {/* بطاقات الشحنات الميدانية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map(order => {
          const branch = branches.find(b => b.id === order.branchId);
          const assignedDriver = drivers.find(d => d.id === order.assignedDriverId);
          const isUnassigned = order.status === 'unassigned';
          const availableDrivers = drivers.filter(d => d.online);
          const trackingId = order.id.startsWith('SND-') ? order.id : 'SND-' + (order.id.replace(/\D/g, '') || '282288');

          return (
            <div key={order.id} className={"bg-slate-900/85 border rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 shadow-xl " + (isUnassigned ? 'border-red-900/50 bg-red-950/10' : 'border-slate-800')}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800">{trackingId}</span>
                    <span className="text-[11px] text-slate-400 font-bold">{branch ? branch.name : ''}</span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedWaybillOrder(order)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 py-1.5 rounded-xl border border-emerald-800/40 text-[11px] font-bold cursor-pointer"
                    title="طباعة بوليصة الشحن الحرارية 4×6"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>بوليصة 4×6</span>
                  </button>
                  <button
                    onClick={() => setEditingOrder({ ...order })}
                    className="flex-1 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  {!isUnassigned && order.status !== 'delivered' && (
                    <button
                      onClick={() => setReassigningOrder({ order, newDriverId: '' })}
                      className="flex-1 flex items-center justify-center gap-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 py-1.5 rounded-xl border border-amber-800/40 text-[11px] font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تحويل</span>
                    </button>
                  )}
                  {order.status !== 'delivered' && (
                    <button
                      onClick={() => setExceptionOrder(order)}
                      className="flex items-center justify-center p-1.5 bg-red-950/50 hover:bg-red-900 text-red-300 rounded-xl border border-red-800/40 text-[11px] font-bold cursor-pointer"
                      title="تسجيل تعثر توصيل أو إرجاع"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 mb-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">{order.customerName}</h3>
                    <a href={'tel:' + order.customerPhone} className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-800/40 font-mono">
                      <Phone className="w-3 h-3" />
                      <span>{order.customerPhone}</span>
                    </a>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.customerAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-3 text-xs">
                  <div>
                    <span className="text-slate-400">المطلوب: </span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">{order.totalAmount} ر.س</span>
                    <span className="mr-1 text-[10px] text-slate-400">({order.paymentMethod === 'cash' ? '💵 COD' : '💳 مدى'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">أجرة المندوب: </span>
                    <span className="font-mono font-bold text-purple-400">{order.driverCommission} ر.س</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                {isUnassigned ? (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:border-emerald-500 outline-none"
                      value={selectedDriverForOrder[order.id] || ''}
                      onChange={(e) => setSelectedDriverForOrder({ ...selectedDriverForOrder, [order.id]: e.target.value })}
                    >
                      <option value="">-- اختر مندوباً للشحنة --</option>
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.status === 'available' ? '🟢 متاح' : '🟡 معه طلبيات'})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const drvId = selectedDriverForOrder[order.id];
                        if (!drvId) return alert('اختر المندوب أولاً');
                        onAssignOrder(order.id, drvId);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      إسناد
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">المندوب المسؤول:</div>
                      <div className="font-bold text-slate-200">{assignedDriver ? assignedDriver.name : 'غير محدد'}</div>
                    </div>
                    {assignedDriver && (
                      <a href={'tel:' + assignedDriver.phone} className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{assignedDriver.phone}</span>
                      </a>
                    )}
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
          driver={drivers.find(d => d.id === selectedWaybillOrder.assignedDriverId)}
          onClose={() => setSelectedWaybillOrder(null)}
        />
      )}

      {manifestDriverId && (
        <DriverManifestModal driverId={manifestDriverId} onClose={() => setManifestDriverId(null)} />
      )}

      {exceptionOrder && (
        <DeliveryExceptionModal order={exceptionOrder} onClose={() => setExceptionOrder(null)} onSuccess={onRefresh} />
      )}

      {editingOrder && (
        <div className="fixed inset-0 z-[2500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>تعديل بيانات الشحنة ({editingOrder.id})</span>
            </h3>
            <form onSubmit={handleSaveEditOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم العميل:</label>
                  <input type="text" required value={editingOrder.customerName} onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الجوال:</label>
                  <input type="text" required value={editingOrder.customerPhone} onChange={(e) => setEditingOrder({ ...editingOrder, customerPhone: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-purple-500 outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان التوصيل:</label>
                <input type="text" required value={editingOrder.customerAddress} onChange={(e) => setEditingOrder({ ...editingOrder, customerAddress: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-purple-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ (ر.س):</label>
                  <input type="number" required value={editingOrder.totalAmount} onChange={(e) => setEditingOrder({ ...editingOrder, totalAmount: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-purple-500 outline-none font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">طريقة الدفع:</label>
                  <select value={editingOrder.paymentMethod} onChange={(e) => setEditingOrder({ ...editingOrder, paymentMethod: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 focus:border-purple-500 outline-none">
                    <option value="cash">كاش عند الاستلام (COD)</option>
                    <option value="mada">شبكة مدى</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reassigningOrder && (
        <div className="fixed inset-0 z-[2500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>إعادة إسناد الشحنة ({reassigningOrder.order.id})</span>
            </h3>
            <form onSubmit={handleConfirmReassign} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">المندوب الجديد:</label>
                <select required value={reassigningOrder.newDriverId} onChange={(e) => setReassigningOrder({ ...reassigningOrder, newDriverId: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none">
                  <option value="">-- اختر المندوب البديل --</option>
                  {drivers.filter(d => d.id !== reassigningOrder.order.assignedDriverId).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setReassigningOrder(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">تأكيد التحويل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddDriverModal && (
        <div className="fixed inset-0 z-[2500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>إضافة مندوب لسند إكسبريس</span>
            </h3>
            <form onSubmit={handleCreateDriver} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المندوب:</label>
                <input type="text" required value={driverFormData.name} onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الجوال:</label>
                <input type="text" required value={driverFormData.phone} onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع المركبة:</label>
                <input type="text" value={driverFormData.vehicle} onChange={(e) => setDriverFormData({ ...driverFormData, vehicle: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddDriverModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">إضافة ومزامنة المندوب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>إنشاء شحنة إكسبريس جديدة</span>
            </h3>
            <form onSubmit={handleSubmitNewOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الفرع المصدّر:</label>
                <select value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none">
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">اسم المستلم *:</label>
                  <input type="text" required placeholder="فيصل الخالدي" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">جوال المستلم *:</label>
                  <input type="text" required placeholder="05XXXXXXXX" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">عنوان التوصيل بالتفصيل *:</label>
                <input type="text" required placeholder="الخبر - حي العليا - شارع الأمير فيصل" value={formData.customerAddress} onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">محتويات الشحنة:</label>
                <input type="text" placeholder="سحبة أوكسفا + نكهة ناستي 50" value={formData.productDescription} onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">المبلغ (ر.س) *:</label>
                  <input type="number" required placeholder="250" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">طريقة الدفع:</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none">
                    <option value="cash">دفع عند الاستلام (COD)</option>
                    <option value="mada">شبكة مدى</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40">إنشاء الشحنة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
