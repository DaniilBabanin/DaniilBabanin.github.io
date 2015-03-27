particlesJS('particles-js', {
  particles: {
    color: '#fff',
    color_random: false,
    shape: 'circle', // "circle", "edge" or "triangle"
    opacity: {
      opacity: 1.0,
      anim: {
        enable: false,
        speed: .5,
        opacity_min: 0.5,
        sync: false
      }
    },
    size: 2.5,
    size_random: true,
    nb: 100,
    line_linked: {
      enable_auto: true,
      distance: 500,
      color: '#fff',
      opacity: 0.6,
      width: 1,
      condensed_mode: {
        enable: true,
        rotateX: 600,
        rotateY: 600
      }
    },
    anim: {
      enable: true,
      speed: .8

    }
  },
  interactivity: {
    enable: true,
    mouse: {
      distance: 250
    },
    detect_on: 'canvas', // "canvas" or "window"
    mode: 'false', // "grab" of false
    line_linked: {
      opacity: .6
    },
    events: {
      onclick: {
        enable: true,
        mode: 'push', // "push" or "remove"
        nb: 1
      },
      onresize: {
        enable: true,
        mode: 'bounce', // "out" or "bounce"
        density_auto: true,
        density_area: 1000 // nb_particles = particles.nb * (canvas width *  canvas height / 1000) / density_area
      }
    }
  },
  /* Retina Display Support */
  retina_detect: true
});