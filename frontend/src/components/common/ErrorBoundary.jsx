import React from 'react';
import { ShieldAlert, RefreshCw, LogIn } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Nexo360 ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-red-200 shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 mb-2">
                Ocurrió un problema en la vista
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                Nexo360 protegió la sesión. Puedes reiniciar y volver a la pantalla de inicio de sesión institucional.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-mono text-left overflow-auto max-h-24 border border-slate-200">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[#002B49] text-white hover:bg-[#001f35] focus:outline-hidden focus:ring-4 focus:ring-amber-400 min-h-[44px]"
              >
                <LogIn className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Volver al Inicio de Sesión</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-400 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Recargar página</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
