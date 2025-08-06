// Function to detect mobile devices
function isMobile() {
    return window.innerWidth <= 768 || 
           navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i);
}

// Function to get particle configuration based on device
function getParticleConfig() {
    const isMobileDevice = isMobile();
    
    return {
        "particles": {
            "number": {
                "value": isMobileDevice ? 150 : 300,
                "density": {
                    "enable": true,
                    "value_area": isMobileDevice ? 300 : 500
                }
            },
            "color": {
                "value": ['#FFE792',
                    '#118811',
                    '#E6DB74',
                    '#AE81FF',
                    '#F92672',
                    '#66D9EF',
                    '#A6E22E',
                    '#FD971F',
                    '#F83333',
                    '#D02000',
                    '#DDB700'
                ]
            },
            "opacity": {
                "value": 1.0,
                "random": false
            },
            "size": {
                "value": 10,
                "random": true
            },
            "line_linked": {
                "enable": true,
                "distance": isMobileDevice ? 100 : 120,
                "color": "#ffffff",
                "opacity": 0.75,
                "width": 0.75
            },
            "move": {
                "enable": true,
                "speed": isMobileDevice ? 1 : 2,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "snake",
                "attract": {
                    "enable": true,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": false
            },
            "modes": {
                "grab": {
                    "distance": isMobileDevice ? 150 : 200,
                    "line_linked": {
                        "opacity": 0.7
                    }
                },
                "push": {
                    "particles_nb": isMobileDevice ? 2 : 4
                },
                "repulse": {
                    "distance": isMobileDevice ? 70 : 100,
                    "duration": 0.4
                }
            }
        },
        "retina_detect": true
    };
}

// Store the particlesJS instance and animation frame ID
let particlesInstance = null;
let animationFrameId = null;

// Function to initialize particles
function initParticles() {
    window.particlesJS('particles-js', getParticleConfig());
}

// Function to destroy particles
function destroyParticles() {
    // Use the destroy method of the WebGLParticles instance if available
    if (window.webglParticles && typeof window.webglParticles.destroy === 'function') {
        window.webglParticles.destroy();
    } else {
        // Fallback to clearing the container
        const particlesContainer = document.getElementById('particles-js');
        if (particlesContainer) {
            particlesContainer.innerHTML = '';
        }
    }
    
    // Clear the global reference
    window.webglParticles = null;
}

// Initialize particles with responsive configuration
initParticles();

// Initialize i18n and translate content
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
      
      // Special handling for elements with HTML content
      // Skills summary
      const skillsSummary = document.getElementById('skills-summary');
      if (skillsSummary) {
        skillsSummary.innerHTML = i18n.t('skills_summary') + ' <a href="#" id="skills-link">' + i18n.t('skills_link') + '</a>.';
        // Reattach event listener to skills link
        document.getElementById('skills-link').addEventListener('click', function(e) {
          e.preventDefault();
          // Dispatch custom event to trigger expandSkills
          document.dispatchEvent(new CustomEvent('expandSkillsRequested'));
        });
      }
      
      // Full CV
      const fullCV = document.getElementById('full-cv');
      if (fullCV) {
        fullCV.innerHTML = i18n.t('full_cv') + ' <a href="https://next.babanin.de/s/mADYT7MrqL6cTKs">' + i18n.t('cv_here') + '</a> ' + 
          i18n.t('cv_email') + ' <a href="mailto:contact@babanin.de">' + i18n.t('cv_email_address') + '</a> ' + i18n.t('cv_password');
      }
      
      // CV contact
      const cvContact = document.getElementById('cv-contact');
      if (cvContact) {
        cvContact.innerHTML = i18n.t('cv_contact') + ' <a href="mailto:contact@babanin.de">' + i18n.t('cv_email_address') + '</a>.';
      }
      
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
    const frame = document.querySelector('.frame');
    if (frame) {
      frame.classList.add('loaded');
    }
    
    // Set up language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
      // Populate language options
      i18n.getSupportedLanguages().forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang.toUpperCase();
        if (lang === i18n.getCurrentLanguage()) {
          option.selected = true;
        }
        languageSwitcher.appendChild(option);
      });
      
      // Add event listener for language change
      languageSwitcher.addEventListener('change', function() {
        const newLanguage = this.value;
        if (i18n.setLanguage(newLanguage)) {
          translatePage();
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    
    // Add loaded class even if there's an error
    const frame = document.querySelector('.frame');
    if (frame) {
      frame.classList.add('loaded');
    }
  }
    const toggleButton = document.getElementById('toggle-particles');
    
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const particlesContainer = document.getElementById('particles-js');
            const canvas = particlesContainer.querySelector('canvas');
            
            if (canvas) {
                if (canvas.style.display === 'none') {
                    canvas.style.display = 'block';
                    this.textContent = 'Disable Particles';
                    // Reinitialize particles
                    initParticles();
                } else {
                    canvas.style.display = 'none';
                    this.textContent = 'Enable Particles';
                    // Destroy particles to stop calculations
                    destroyParticles();
                }
            } else {
                // If no canvas exists, create particles
                this.textContent = 'Disable Particles';
                initParticles();
            }
        });
    }
    
    // Handle window resize to adjust particles for device changes
    window.addEventListener('resize', function() {
        // Destroy existing particles
        destroyParticles();
        
        // Reinitialize with new configuration after a short delay
        setTimeout(initParticles, 100);
    });
});
