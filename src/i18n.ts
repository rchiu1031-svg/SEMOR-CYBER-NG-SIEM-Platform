import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

let savedLng = 'zh';
try {
  if (typeof window !== 'undefined') {
    savedLng = localStorage.getItem('i18nextLng') || 'zh';
  }
} catch {
  savedLng = 'zh';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja }
    },
    lng: savedLng,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
