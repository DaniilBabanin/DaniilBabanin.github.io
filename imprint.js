// Initialize i18n for imprint page
document.addEventListener('DOMContentLoaded', async function() {
  // Import and initialize shared i18n
  const { initializeI18n, translatePage, showContent } = await import('./i18n/shared.js');
  const i18n = await initializeI18n();
  
  if (i18n) {
    // Initial translation
    translatePage(i18n);
    
    // Show content
    showContent();
    
    // Set up language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
      // Add event listener for language change
      languageSwitcher.addEventListener('change', async function() {
        const newLanguage = this.value;
        if (await i18n.setLanguage(newLanguage)) {
          translatePage(i18n);
        }
      });
      
      // Set the selected option to the current language
      languageSwitcher.value = i18n.getCurrentLanguage();
    }
  } else {
    // Show content even if i18n fails
    showContent();
  }
});
