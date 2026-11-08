import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Register Dedicated Progressive Web App Service Worker for Vendor Portal with active update
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-vendor.js', { scope: '/app/', updateViaCache: 'none' })
      .then((registration) => {
        console.log('[Vendor Mobile PWA] Service Worker registered with scope:', registration.scope);
        registration.update();

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Vendor Mobile PWA] New version installed. Activating immediately...');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[Vendor Mobile PWA] Service Worker registration failed:', error);
      });
  });
}
