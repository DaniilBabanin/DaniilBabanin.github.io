// Initialize i18n for imprint page
document.addEventListener('DOMContentLoaded', async function() {
  // Import and initialize i18n
  try {
    const i18nModule = await import('./i18n/i18n.js');
    const i18n = i18nModule.default;
    
    // Wait for i18n to be initialized
    await i18n.initialized;
    
    // Function to translate all data-i18n attributes
    function translatePage() {
      // Handle elements with only text content
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        // Skip elements with child elements (HTML content)
        if (element.children.length === 0) {
          element.textContent = i18n.t(key);
        }
      });
      
      // Special handling for attributes
      document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = i18n.t(key);
      });
      
      document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = i18n.t(key);
      });
    }
    
    // Initial translation
    translatePage();
    
    // Add loaded class to show content
    const container = document.querySelector('.container');
    if (container) {
      container.classList.add('loaded');
    }
    
    // Set up language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
      // Add event listener for language change
      languageSwitcher.addEventListener('change', function() {
        const newLanguage = this.value;
        if (i18n.setLanguage(newLanguage)) {
          translatePage();
        }
      });
      
      // Set the selected option to the current language
      languageSwitcher.value = i18n.getCurrentLanguage();
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    
    // Add loaded class even if there's an error
    const container = document.querySelector('.container');
    if (container) {
      container.classList.add('loaded');
    }
  }
});
