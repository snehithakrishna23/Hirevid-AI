import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl text-center shadow-xl max-w-md mx-auto my-12 select-none animate-slide-up">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="font-extrabold text-white text-base">Something went wrong.</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            A component failed to render correctly. Try refreshing the workspace.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-5 px-5 py-2 bg-red-600 border border-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-750 active:scale-95 transition-all shadow-md shadow-red-950/20 cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}
