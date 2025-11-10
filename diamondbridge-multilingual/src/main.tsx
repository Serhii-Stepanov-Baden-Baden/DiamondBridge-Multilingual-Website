import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/Context';
import './index.css';

// Безопасная проверка корневого элемента
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('❌ Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
