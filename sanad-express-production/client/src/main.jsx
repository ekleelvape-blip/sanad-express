import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.pathname;
  };

  handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('sanad_user');
      localStorage.removeItem('sanad_driver_auth');
      localStorage.removeItem('sanad_driver_id');
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-['Tajawal','IBM_Plex_Sans_Arabic',sans-serif]" dir="rtl">
          <div className="max-w-md w-full bg-[#0f1523]/95 border border-cyan-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 backdrop-blur-md">
            <div className="w-16 h-16 bg-cyan-500/20 text-[#00d2d3] rounded-2xl flex items-center justify-center mx-auto text-xl font-black border border-cyan-500/30 shadow-[0_0_20px_rgba(0,210,211,0.3)]">
              سند
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">سند SANAD — تم تأمين وحماية الجلسة بنجاح</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              حدث انتقال في الصفحة وتم حفظ بياناتك وحمايتها تلقائياً. يمكنك الاستمرار مباشرة أو تحديث الصفحة أو تفريغ الذاكرة المؤقتة.
            </p>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(0,210,211,0.35)] cursor-pointer active:scale-95 transition-all"
              >
                الاستمرار فوراً وإعادة الفتح ⚡
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs py-2.5 rounded-xl border border-slate-700 cursor-pointer active:scale-95 transition-all"
              >
                تحديث الصفحة الحالية 🔄
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="w-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs py-2 rounded-xl border border-rose-900/50 cursor-pointer transition-all"
              >
                إعادة ضبط الجلسة وتفريغ الذاكرة 🧹
              </button>
            </div>

            {/* تفاصيل الخطأ الفنية إن رغب المستخدم أو الدعم */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="text-[10px] text-slate-500 hover:text-slate-400 underline cursor-pointer"
              >
                {this.state.showDetails ? 'إخفاء التفاصيل التقنية ▲' : 'عرض التفاصيل التقنية 🔍'}
              </button>
              {this.state.showDetails && this.state.error && (
                <div className="mt-2 p-2.5 bg-black/60 rounded-xl border border-slate-800 text-[10px] text-rose-400 font-mono text-left overflow-x-auto max-h-32" dir="ltr">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
