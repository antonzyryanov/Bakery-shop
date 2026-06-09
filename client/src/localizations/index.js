import en from './en.js';
import ru from './ru.js';

const dictionaries = { en, ru };
const supportedLocales = ['en', 'ru'];
export const localeStorageKey = 'bakery_locale';

const getByPath = (obj, path) => path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export const getBrowserLocale = () => {
  const lang = (navigator.language || 'en').toLowerCase();
  return lang.startsWith('ru') ? 'ru' : 'en';
};

export const getInitialLocale = () => {
  const stored = localStorage.getItem(localeStorageKey);
  if (stored && supportedLocales.includes(stored)) {
    return stored;
  }

  return getBrowserLocale();
};

export const isSupportedLocale = (locale) => supportedLocales.includes(locale);

export const createTranslator = (locale) => {
  const dict = dictionaries[locale] || dictionaries.en;
  return (key) => getByPath(dict, key) ?? getByPath(dictionaries.en, key) ?? key;
};
