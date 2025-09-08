import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import mrTranslations from '../locales/mr.json';

const LanguageContext = createContext();

const translations = {
  en: enTranslations,
  mr: mrTranslations
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    
    // Set document language attribute
    document.documentElement.lang = language;
    
    // Set document direction (both languages are LTR)
    document.documentElement.dir = 'ltr';
  }, [language]);

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          } else {
            value = key; // Return key if no translation found
            break;
          }
        }
        break;
      }
    }
    
    // Handle parameterized translations
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return value || key;
  };

  const formatCurrency = (amount) => {
    const symbol = t('currency.symbol');
    const formattedAmount = new Intl.NumberFormat(language === 'mr' ? 'mr-IN' : 'en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `${symbol}${formattedAmount}`;
  };

  const formatDate = (date, format = 'short') => {
    const dateObj = new Date(date);
    const locale = language === 'mr' ? 'mr-IN' : 'en-IN';
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      case 'long':
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      case 'withTime':
        return dateObj.toLocaleString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return dateObj.toLocaleDateString(locale);
    }
  };

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
    ];
  };

  const value = {
    language,
    t,
    formatCurrency,
    formatDate,
    changeLanguage,
    getAvailableLanguages,
    isRTL: false // Both languages are LTR
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
