import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './i18n/Context.tsx'; // 👈 обязательно!
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider> {/* 👈 оборачиваем App */}
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
