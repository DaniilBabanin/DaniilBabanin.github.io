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

// Particles on by default; off only if user explicitly disabled them
let particlesEnabled = localStorage.getItem('particles') !== 'off';

// Function to initialize particles
function initParticles() {
    window.particlesJS('particles-js', getParticleConfig());

    // Fade in particles after initialization
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer) {
        setTimeout(() => {
            particlesContainer.style.opacity = '1';
        }, 100);
    }
}

// Load particles asynchronously and fade them in
if (particlesEnabled) {
    setTimeout(initParticles, 100);
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

// Update toggle button label, translated when i18n is ready
function updateToggleButton() {
    const button = document.getElementById('toggle-particles');
    if (!button) return;
    const key = particlesEnabled ? 'particles_disable' : 'particles_enable';
    const label = window.i18n ? window.i18n.t(key) : key;
    button.textContent = label !== key
        ? label
        : (particlesEnabled ? 'Disable Particles' : 'Enable Particles');
}


// Initialize i18n and translate content
document.addEventListener('DOMContentLoaded', async function() {
  // Import and initialize shared i18n
  const { initializeI18n, translatePage, showContent } = await import('./i18n/shared.min.js');
  const i18n = await initializeI18n();
  
  if (i18n) {
    // Function to translate all data-i18n attributes with special handling for HTML content
    function translatePageWithHTML() {
      // Handle regular translations
      translatePage(i18n);
      
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
      
      // CV contact
      const cvContact = document.getElementById('cv-contact');
      if (cvContact) {
        cvContact.innerHTML = i18n.t('cv_contact') + ' <a href="mailto:contact@babanin.de">' + i18n.t('cv_email_address') + '</a>.';
      }

      // Toggle button label
      updateToggleButton();
    }
    
    // Initial translation
    translatePageWithHTML();
    
    // Show content
    showContent();
    
    // Set up language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
      // Set the selected option to the current language
      languageSwitcher.value = i18n.getCurrentLanguage();

      // Add event listener for language change
      languageSwitcher.addEventListener('change', async function() {
        const newLanguage = this.value;
        if (await i18n.setLanguage(newLanguage)) {
          translatePageWithHTML();
        }
      });
    }
  } else {
    // Show content even if i18n fails
    showContent();
  }
    const toggleButton = document.getElementById('toggle-particles');

    if (toggleButton) {
        updateToggleButton();

        toggleButton.addEventListener('click', function() {
            particlesEnabled = !particlesEnabled;
            localStorage.setItem('particles', particlesEnabled ? 'on' : 'off');

            if (particlesEnabled) {
                initParticles();
            } else {
                // Destroy particles to stop calculations
                destroyParticles();
            }

            updateToggleButton();
        });
    }

    // Handle window resize to adjust particles for device changes.
    // Debounced, and height-only changes (mobile URL bar) are ignored.
    let resizeTimer = null;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', function() {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (!particlesEnabled) return;
            destroyParticles();
            setTimeout(initParticles, 100);
        }, 250);
    });
});
