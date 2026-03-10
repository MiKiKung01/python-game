import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      }>
        <App />
      </Suspense>
    </ThemeProvider>
  </React.StrictMode>,
);
