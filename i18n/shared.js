// Shared i18n initialization code to avoid duplication between pages
export async function initializeI18n() {
  try {
    const i18nModule = await import('./i18n.js');
    const i18n = i18nModule.default;
    
    // Wait for i18n to be initialized
    await i18n.initialized;
    
    return i18n;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    return null;
  }
}

export function translatePage(i18n) {
  if (!i18n) return;
  
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

export function showContent() {
  // Add loaded class to show content
  const frame = document.querySelector('.frame');
  if (frame) {
    frame.classList.add('loaded');
  }
  
  const container = document.querySelector('.container');
  if (container) {
    container.classList.add('loaded');
  }
}
