import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './i18n/Context'; // 👈 обязательно!
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider> {/* 👈 оборачиваем App */}
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
