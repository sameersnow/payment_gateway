import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FrappeProvider } from 'frappe-react-sdk';

const getSiteName = () => {
  // 1. Try to get sitename from Frappe's global object (boot)
  if (
    //@ts-ignore
    window.frappe?.boot?.sitename
  ) {
    //@ts-ignore
    const sitename = window.frappe.boot.sitename;
    return sitename;
  }

  // 2. In development, use the VITE_SITE_NAME from env
  if (import.meta.env.DEV) {
    const sitename = import.meta.env.VITE_SITE_NAME || 'frontend';
    return sitename;
  }

  // 3. In production, use hostname
  const sitename = window.location.hostname;
  return sitename;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrappeProvider
      socketPort={import.meta.env.VITE_SOCKET_PORT}
      siteName={getSiteName()}
    >
      <App />
    </FrappeProvider>
  </StrictMode>
);
