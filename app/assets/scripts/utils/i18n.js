'use strict';

let currentLang = 'en';

export function setLanguage (lang) {
  currentLang = lang;
}

export function getLanguage () {
  return currentLang;
}

export function getLanguageName () {
  return getAvailableLanguages().find(l => l.key === getLanguage()).name;
}

export function getAvailableLanguages () {
  return [
    {key: 'en', name: 'English'},
    {key: 'eo', name: 'Esperanto'}
  ];
}

export function isValidLanguage (key) {
  return !!getAvailableLanguages().find(l => l.key === key);
}

export function t (string, replace = {}) {
  // TEMP!
  // Use something like transifex.
  // Transifex provides 1 file per language which we can require.
  let l = {
    en: { // require('./langfiles/en')
      'Projects': 'Projects',
      'Change language': 'Change language',
      'Select language': 'Select language',
      'About': 'About',
      'Help': 'Help',
      'Page not found': 'Page not found',
      'The requested page does not exist or may have been removed.': 'The requested page does not exist or may have been removed.',
      '1 scenarios': '1 scenarios',
      '{count} scenarios': '{count} scenarios'
    },
    eo: {
      'Projects': 'Projektoj',
      'Change language': 'Ŝanĝo lingvo',
      'Select language': 'Elektu lingvo',
      'About': 'Pri',
      'Help': 'Helpi',
      'Page not found': 'Paĝo ne trovita',
      'The requested page does not exist or may have been removed.': 'La petita paĝo ne ekzistas aŭ povas esti forigitaj.',
      '1 scenarios': '1 scenaro',
      '{count} scenarios': '{count} scenaroj'
    }
  };

  if (!l[currentLang][string]) {
    if (process.env.DS_ENV === 'testing') {
      throw new Error(`Missing (${currentLang}) translation for (${string})`);
    }
    if (process.env.DS_ENV !== 'production') {
      markMissing(string);
      console.warn(`Missing (${currentLang}) translation for (${string})`);
      return string;
    }
  }

  let res = l[currentLang][string] || '';
  Object.keys(replace).forEach(o => {
    let regex = new RegExp(`{${o}}`, 'g');
    res = res.replace(regex, replace[o]);
  });

  return res;
}

//
// Language helper to cache the missing translation for easier access.
// Used for development only.
//

let missingTranslationCache = {};

function markMissing (string) {
  let cache = missingTranslationCache;
  let l = getLanguage();

  if (!cache[l]) {
    cache[l] = [];
  }

  if (cache[l].indexOf(string) === -1) {
    cache[l].push(string);
  }
}

window.getMissingTranslations = () => missingTranslationCache;
window.getMissingTranslationsJSON = () => JSON.stringify(missingTranslationCache, null, '  ');
