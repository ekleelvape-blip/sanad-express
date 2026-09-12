import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-['Tajawal',sans-serif]" dir="rtl">
          <div className="max-w-md w-full bg-[#0f1523] border border-cyan-900/50 rounded-3xl p-8 shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-cyan-500/20 text-[#00d2d3] rounded-2xl flex items-center justify-center mx-auto text-2xl font-black border border-cyan-500/30 shadow-[0_0_20px_rgba(0,210,211,0.3)]">
              سند
            </div>
            <h2 className="text-xl font-black text-white">تم استعادة وتأمين الشاشة</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              حدث انتقال غير متوقع، وتم حفظ وحماية كافة بياناتك تلقائياً. اضغط على الزر للعودة إلى الصفحة الرئيسية.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full bg-gradient-to-r from-cyan-600 to-[#00d2d3] hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(0,210,211,0.35)] cursor-pointer active:scale-95 transition-all"
              >
                العودة للرئيسية والتحديث 🔄
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
