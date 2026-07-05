import { createContext, useContext, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lang');
    return saved || 'hi'; // default to Hindi as requested
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const setLanguage = (l) => setLang(l);

  const t = (key) => {
    if (!key) return '';
    return (translations[lang] && translations[lang][key]) || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
