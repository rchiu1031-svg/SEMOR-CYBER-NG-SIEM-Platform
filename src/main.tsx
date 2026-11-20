import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { EnglishUiTranslatorBridge } from './components/EnglishUiTranslatorBridge';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <EnglishUiTranslatorBridge />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

