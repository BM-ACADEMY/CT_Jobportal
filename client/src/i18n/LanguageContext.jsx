import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ta } from './translations';

// Tiny dependency-free i18n. Default is English; Tamil is opt-in via the header toggle.
// t(key, fallback) returns the Tamil string only when language is 'ta' AND the key exists;
// otherwise it returns the English fallback so English output never changes.
const STORAGE_KEY = 'vv_lang';
const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (key, fallback) => fallback });

const readLang = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ta' ? 'ta' : 'en';
  } catch {
    return 'en';
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(readLang);

  const setLang = useCallback((next) => {
    const value = next === 'ta' ? 'ta' : 'en';
    setLangState(value);
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked: keep in memory only */ }
  }, []);

  useEffect(() => {
    try { document.documentElement.lang = lang === 'ta' ? 'ta' : 'en'; } catch { /* no document */ }
  }, [lang]);

  const t = useCallback((key, fallback) => {
    if (lang === 'ta') {
      const value = ta[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return fallback;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useT = () => useContext(LanguageContext);

// <T k="lbl.Home">Home</T> renders just the text (no wrapper element), so English markup is unchanged.
export const T = ({ k, children }) => {
  const { t } = useContext(LanguageContext);
  return t(k, children);
};
export default LanguageContext;
