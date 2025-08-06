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

// Toggle particle animation
document.addEventListener('DOMContentLoaded', function() {
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
