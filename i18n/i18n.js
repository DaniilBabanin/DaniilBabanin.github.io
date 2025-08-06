/**
 * i18n Library
 * Handles language detection and translation
 */

class I18n {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'en';
    this.defaultLanguage = 'en';
    this.supportedLanguages = ['en', 'de'];
  }

  async init() {
    // Load translations
    try {
      const translationsModule = await import('./translations.js');
      this.translations = translationsModule.translations;
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to empty translations
      this.translations = { en: {}, de: {} };
    }
    
    // Detect language
    this.currentLanguage = this.detectLanguage();
  }

  detectLanguage() {
    // Check if we already have a language preference in localStorage
    if (typeof localStorage !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
        return savedLanguage;
      }
    }

    // Check browser language
    let browserLanguage = 'en';
    if (typeof navigator !== 'undefined') {
      browserLanguage = navigator.language || navigator.userLanguage || 'en';
    }

    // If German is detected, use German, otherwise default to English
    if (browserLanguage.startsWith('de')) {
      return 'de';
    }

    return this.defaultLanguage;
  }

  setLanguage(language) {
    if (this.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('language', language);
      }
      return true;
    }
    return false;
  }

  t(key) {
    // Return translated string or key if not found
    if (this.translations[this.currentLanguage] && this.translations[this.currentLanguage][key]) {
      return this.translations[this.currentLanguage][key];
    }
    // Fallback to English if translation not found
    if (this.translations['en'] && this.translations['en'][key]) {
      return this.translations['en'][key];
    }
    // Return key if no translation found
    return key;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

// Create a singleton instance
const i18n = new I18n();

// Create a promise that resolves when initialization is complete
i18n.initialized = i18n.init();

// Export the instance
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}

// Also export as default for ES6 module imports
export default i18n;
