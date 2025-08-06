/* -----------------------------------------------
/* WebGL Particles System
/* Based on particles.js by Vincent Garreau
/* Rewritten for WebGL rendering
/* ----------------------------------------------- */

// Quadtree implementation for efficient spatial partitioning
class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // { x, y, width, height }
        this.capacity = capacity;
        this.particles = [];
        this.divided = false;
        
        // Child quadrants
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
    
    // Check if a particle is within this quadrant
    contains(particle) {
        return (
            particle.x >= this.boundary.x - this.boundary.width / 2 &&
            particle.x <= this.boundary.x + this.boundary.width / 2 &&
            particle.y >= this.boundary.y - this.boundary.height / 2 &&
            particle.y <= this.boundary.y + this.boundary.height / 2
        );
    }
    
    // Check if a range intersects with this quadrant
    intersects(range) {
        return !(
            range.x - range.width / 2 > this.boundary.x + this.boundary.width / 2 ||
            range.x + range.width / 2 < this.boundary.x - this.boundary.width / 2 ||
            range.y - range.height / 2 > this.boundary.y + this.boundary.height / 2 ||
            range.y + range.height / 2 < this.boundary.y - this.boundary.height / 2
        );
    }
    
    // Insert a particle into the quadtree
    insert(particle) {
        if (!this.contains(particle)) {
            return false;
        }
        
        if (this.particles.length < this.capacity && !this.divided) {
            this.particles.push(particle);
            return true;
        }
        
        if (!this.divided) {
            this.subdivide();
        }
        
        if (this.northeast.insert(particle)) return true;
        if (this.northwest.insert(particle)) return true;
        if (this.southeast.insert(particle)) return true;
        if (this.southwest.insert(particle)) return true;
        
        return false;
    }
    
    // Subdivide into four quadrants
    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.width / 2;
        const h = this.boundary.height / 2;
        
        // Create four child quadrants
        this.northeast = new Quadtree({ x: x + w/2, y: y - h/2, width: w, height: h }, this.capacity);
        this.northwest = new Quadtree({ x: x - w/2, y: y - h/2, width: w, height: h }, this.capacity);
        this.southeast = new Quadtree({ x: x + w/2, y: y + h/2, width: w, height: h }, this.capacity);
        this.southwest = new Quadtree({ x: x - w/2, y: y + h/2, width: w, height: h }, this.capacity);
        
        this.divided = true;
        
        // Redistribute existing particles
        for (let particle of this.particles) {
            if (this.northeast.insert(particle)) continue;
            if (this.northwest.insert(particle)) continue;
            if (this.southeast.insert(particle)) continue;
            if (this.southwest.insert(particle)) continue;
        }
        
        this.particles = [];
    }
    
    // Query particles within a range
    query(range, found) {
        if (!found) found = [];
        
        if (!this.intersects(range)) {
            return found;
        }
        
        for (let particle of this.particles) {
            const dx = particle.x - range.x;
            const dy = particle.y - range.y;
            if (dx * dx + dy * dy <= range.radius * range.radius) {
                found.push(particle);
            }
        }
        
        if (this.divided) {
            this.northeast.query(range, found);
            this.northwest.query(range, found);
            this.southeast.query(range, found);
            this.southwest.query(range, found);
        }
        
        return found;
    }
}

class WebGLParticles {
    constructor(tag_id, params) {
        this.tag_id = tag_id;
        this.params = params;
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.lineProgram = null;
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.lines = [];
        this.quadtree = null;
        this.animationId = null;
        
        // Pre-allocated arrays for better performance
        this.positions = [];
        this.sizes = [];
        this.colors = [];
        this.linePositions = [];
        this.lineColors = [];
        
        // Frame rate limiting
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 24; // 60 FPS target
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupWebGL();
        this.createShaders();
        this.createBuffers();
        this.createParticles();
        this.setupEvents();
        this.animate();
    }

    setupCanvas() {
        const container = document.getElementById(this.tag_id);
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'particles-js-canvas-el';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        container.appendChild(this.canvas);
        
        this.resize();
    }

    setupWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    createShaders() {
        const gl = this.gl;
        
        // Particle shaders
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute float a_size;
            attribute vec4 a_color;
            
            uniform vec2 u_resolution;
            
            varying vec4 v_color;
            
            void main() {
                vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                gl_PointSize = a_size;
                v_color = a_color;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec4 v_color;
            
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
                if (dist > 0.5) discard;
                
                float alpha = 1.0 - (dist * 2.0);
                gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
            }
        `;

        // Line shaders
        const lineVertexShaderSource = `
            attribute vec2 a_position;
            attribute vec4 a_color;
            
            uniform vec2 u_resolution;
            
            varying vec4 v_color;
            
            void main() {
                vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                v_color = a_color;
            }
        `;

        const lineFragmentShaderSource = `
            precision mediump float;
            
            varying vec4 v_color;
            
            void main() {
                gl_FragColor = v_color;
            }
        `;

        // Compile particle shaders
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        // Compile line shaders
        const lineVertexShader = this.createShader(gl.VERTEX_SHADER, lineVertexShaderSource);
        const lineFragmentShader = this.createShader(gl.FRAGMENT_SHADER, lineFragmentShaderSource);
        
        this.lineProgram = gl.createProgram();
        gl.attachShader(this.lineProgram, lineVertexShader);
        gl.attachShader(this.lineProgram, lineFragmentShader);
        gl.linkProgram(this.lineProgram);

        // Get locations
        this.attribLocations = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            size: gl.getAttribLocation(this.program, 'a_size'),
            color: gl.getAttribLocation(this.program, 'a_color')
        };
        
        this.lineAttribLocations = {
            position: gl.getAttribLocation(this.lineProgram, 'a_position'),
            color: gl.getAttribLocation(this.lineProgram, 'a_color')
        };
        
        this.uniformLocations = {
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            lineResolution: gl.getUniformLocation(this.lineProgram, 'u_resolution')
        };
    }
    
    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createBuffers() {
        const gl = this.gl;
        
        // Particle buffers
        this.particlePositionBuffer = gl.createBuffer();
        this.particleSizeBuffer = gl.createBuffer();
        this.particleColorBuffer = gl.createBuffer();
        
        // Line buffers
        this.linePositionBuffer = gl.createBuffer();
        this.lineColorBuffer = gl.createBuffer();
    }
    
    createParticles() {
        // Minimal default params - will be overridden by app.js config
        const defaultParams = {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#fff'
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 1,
                    random: false
                },
                size: {
                    value: 20,
                    random: false
                },
                line_linked: {
                    enable: true,
                    distance: 100,
                    color: '#fff',
                    opacity: 1,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out'
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: false,
                        mode: 'grab'
                    },
                    onclick: {
                        enable: false,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 100,
                        line_linked: {
                            opacity: 1
                        }
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: false
        };
        
        // Merge params
        this.config = JSON.parse(JSON.stringify(defaultParams));
        if (this.params) {
            this.mergeConfig(this.config, this.params);
        }
        
        // Create particles
        this.particles = [];
        const particleCount = this.config.particles.number.value;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    mergeConfig(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.mergeConfig(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    
    createParticle(position) {
        const config = this.config;
        const canvas = this.canvas;
        
        // Size
        const radius = (config.particles.size.random ? Math.random() : 1) * config.particles.size.value;
        
        // Position
        const x = position ? position.x : Math.random() * canvas.width;
        const y = position ? position.y : Math.random() * canvas.height;
        
        // Color
        let color;
        if (Array.isArray(config.particles.color.value)) {
            const colorSelected = config.particles.color.value[Math.floor(Math.random() * config.particles.color.value.length)];
            color = this.hexToRgb(colorSelected);
        } else if (typeof config.particles.color.value === 'string') {
            color = this.hexToRgb(config.particles.color.value);
        } else {
            color = { r: 255, g: 255, b: 255 };
        }
        
        // Opacity
        const opacity = (config.particles.opacity.random ? Math.random() : 1) * config.particles.opacity.value;
        
        // Velocity
        let vx, vy;
        const directions = {
            'top': { x: 0, y: -1 },
            'top-right': { x: 0.5, y: -0.5 },
            'right': { x: 1, y: 0 },
            'bottom-right': { x: 0.5, y: 0.5 },
            'bottom': { x: 0, y: 1 },
            'bottom-left': { x: -0.5, y: 1 },
            'left': { x: -1, y: 0 },
            'top-left': { x: -0.5, y: -0.5 }
        };
        
        const dir = directions[config.particles.move.direction] || { x: 0, y: 0 };
        
        if (config.particles.move.straight) {
            vx = dir.x;
            vy = dir.y;
            if (config.particles.move.random) {
                vx = vx * Math.random();
                vy = vy * Math.random();
            }
        } else {
            vx = dir.x + Math.random() - 0.5;
            vy = dir.y + Math.random() - 0.5;
        }
        
        return {
            x, y, radius, color, opacity, vx, vy,
            original: {
                radius,
                opacity
            }
        };
    }
    
    hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    setupEvents() {
        const canvas = this.canvas;
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('click', () => {
            if (this.config.interactivity.events.onclick.enable) {
                const mode = this.config.interactivity.events.onclick.mode;
                if (mode === 'push') {
                    for (let i = 0; i < this.config.interactivity.modes.push.particles_nb; i++) {
                        this.particles.push(this.createParticle({
                            x: this.mouse.x,
                            y: this.mouse.y
                        }));
                    }
                }
            }
        });
        
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    resize() {
        const container = document.getElementById(this.tag_id);
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    animate() {
        const update = (currentTime) => {
            // Frame rate limiting
            if (this.lastFrameTime === 0) {
                this.lastFrameTime = currentTime;
            }
            
            const deltaTime = currentTime - this.lastFrameTime;
            
            if (deltaTime >= this.frameInterval) {
                this.update();
                this.draw();
                this.lastFrameTime = currentTime;
            }
            
            this.animationId = requestAnimationFrame(update);
        };
        this.animationId = requestAnimationFrame(update);
    }
    
    update() {
        const config = this.config;
        const canvas = this.canvas;
        
        // Create quadtree for this frame
        this.quadtree = new Quadtree(
            { 
                x: canvas.width / 2, 
                y: canvas.height / 2, 
                width: canvas.width, 
                height: canvas.height 
            }, 
            4 // Capacity per quadrant
        );
        
        // Update particles and insert into quadtree
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Move particle
            if (config.particles.move.enable) {
                const ms = config.particles.move.speed / 2;
                p.x += p.vx * ms;
                p.y += p.vy * ms;
            }
            
            // Handle boundaries
            if (config.particles.move.out_mode === 'bounce') {
                if (p.x - p.radius > canvas.width) {
                    p.x = p.radius;
                } else if (p.x + p.radius < 0) {
                    p.x = canvas.width - p.radius;
                }
                
                if (p.y - p.radius > canvas.height) {
                    p.y = p.radius;
                } else if (p.y + p.radius < 0) {
                    p.y = canvas.height - p.radius;
                }
                
                // Bounce off edges
                if (p.x + p.radius > canvas.width || p.x - p.radius < 0) {
                    p.vx = -p.vx;
                }
                if (p.y + p.radius > canvas.height || p.y - p.radius < 0) {
                    p.vy = -p.vy;
                }
            } else if (config.particles.move.out_mode === 'snake') {
                // Snake mode - wrap around edges
                if (p.x - p.radius > canvas.width) {
                    p.x = -p.radius;
                } else if (p.x + p.radius < 0) {
                    p.x = canvas.width + p.radius;
                }
                
                if (p.y - p.radius > canvas.height) {
                    p.y = -p.radius;
                } else if (p.y + p.radius < 0) {
                    p.y = canvas.height + p.radius;
                }
            } else {
                // Out mode - reset position when out of bounds
                if (p.x - p.radius > canvas.width) {
                    p.x = -p.radius;
                    p.y = Math.random() * canvas.height;
                } else if (p.x + p.radius < 0) {
                    p.x = canvas.width + p.radius;
                    p.y = Math.random() * canvas.height;
                }
                
                if (p.y - p.radius > canvas.height) {
                    p.y = -p.radius;
                    p.x = Math.random() * canvas.width;
                } else if (p.y + p.radius < 0) {
                    p.y = canvas.height + p.radius;
                    p.x = Math.random() * canvas.width;
                }
            }
            
            // Insert particle into quadtree
            this.quadtree.insert(p);
        }
        
        // Find lines between particles using quadtree for spatial partitioning
        this.lines = [];
        if (config.particles.line_linked.enable) {
            // For each particle, query nearby particles using quadtree
            for (let i = 0; i < this.particles.length; i++) {
                const p1 = this.particles[i];
                
                // Query particles within connection distance
                const range = {
                    x: p1.x,
                    y: p1.y,
                    radius: config.particles.line_linked.distance
                };
                
                const nearbyParticles = this.quadtree.query(range);
                
                // Check for connections with nearby particles
                for (let j = 0; j < nearbyParticles.length; j++) {
                    const p2 = nearbyParticles[j];
                    
                    // Skip if it's the same particle
                    if (p1 === p2) continue;
                    
                    // Check if we've already checked this pair (to avoid duplicates)
                    // We only check pairs where p1 comes before p2 in the array
                    if (this.particles.indexOf(p1) >= this.particles.indexOf(p2)) continue;
                    
                    this.checkAndAddLine(p1, p2, config);
                }
                
                // For snake mode, also check wraparound connections
                if (config.particles.move.out_mode === 'snake') {
                    // Check for particles on opposite edges
                    // We'll create virtual queries on the opposite sides
                    
                    // Left edge wrap to right edge
                    if (p1.x < config.particles.line_linked.distance) {
                        const rightRange = {
                            x: p1.x + canvas.width,
                            y: p1.y,
                            radius: config.particles.line_linked.distance
                        };
                        const rightParticles = this.quadtree.query(rightRange);
                        for (let j = 0; j < rightParticles.length; j++) {
                            const p2 = rightParticles[j];
                            if (p1 === p2) continue;
                            if (this.particles.indexOf(p1) >= this.particles.indexOf(p2)) continue;
                            
                            // Create a virtual particle for connection
                            const virtualP1 = { x: p1.x + canvas.width, y: p1.y };
                            this.checkAndAddLine(virtualP1, p2, config);
                        }
                    }
                    
                    // Right edge wrap to left edge
                    if (p1.x > canvas.width - config.particles.line_linked.distance) {
                        const leftRange = {
                            x: p1.x - canvas.width,
                            y: p1.y,
                            radius: config.particles.line_linked.distance
                        };
                        const leftParticles = this.quadtree.query(leftRange);
                        for (let j = 0; j < leftParticles.length; j++) {
                            const p2 = leftParticles[j];
                            if (p1 === p2) continue;
                            if (this.particles.indexOf(p1) >= this.particles.indexOf(p2)) continue;
                            
                            // Create a virtual particle for connection
                            const virtualP1 = { x: p1.x - canvas.width, y: p1.y };
                            this.checkAndAddLine(virtualP1, p2, config);
                        }
                    }
                    
                    // Top edge wrap to bottom edge
                    if (p1.y < config.particles.line_linked.distance) {
                        const bottomRange = {
                            x: p1.x,
                            y: p1.y + canvas.height,
                            radius: config.particles.line_linked.distance
                        };
                        const bottomParticles = this.quadtree.query(bottomRange);
                        for (let j = 0; j < bottomParticles.length; j++) {
                            const p2 = bottomParticles[j];
                            if (p1 === p2) continue;
                            if (this.particles.indexOf(p1) >= this.particles.indexOf(p2)) continue;
                            
                            // Create a virtual particle for connection
                            const virtualP1 = { x: p1.x, y: p1.y + canvas.height };
                            this.checkAndAddLine(virtualP1, p2, config);
                        }
                    }
                    
                    // Bottom edge wrap to top edge
                    if (p1.y > canvas.height - config.particles.line_linked.distance) {
                        const topRange = {
                            x: p1.x,
                            y: p1.y - canvas.height,
                            radius: config.particles.line_linked.distance
                        };
                        const topParticles = this.quadtree.query(topRange);
                        for (let j = 0; j < topParticles.length; j++) {
                            const p2 = topParticles[j];
                            if (p1 === p2) continue;
                            if (this.particles.indexOf(p1) >= this.particles.indexOf(p2)) continue;
                            
                            // Create a virtual particle for connection
                            const virtualP1 = { x: p1.x, y: p1.y - canvas.height };
                            this.checkAndAddLine(virtualP1, p2, config);
                        }
                    }
                }
            }
        }
    }
    
    // Helper method to check if two particles should have a line between them
    checkAndAddLine(p1, p2, config) {
        // Check if p1 is a virtual particle (has no radius property)
        const isP1Virtual = p1.radius === undefined;
        const isP2Virtual = p2.radius === undefined;
        
        // Calculate distance
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;
        const maxDistSq = config.particles.line_linked.distance * config.particles.line_linked.distance;
        
        // Only consider particles within a reasonable distance (using squared distance for efficiency)
        if (distSq <= maxDistSq) {
            // Only calculate actual distance when needed for opacity
            const dist = Math.sqrt(distSq);
            // Calculate opacity based on distance (fading effect)
            const opacity = config.particles.line_linked.opacity * (1 - dist / config.particles.line_linked.distance);
            
            // For virtual particles, we need to draw wraparound lines
            if (isP1Virtual) {
                // Draw a single line from the actual position of p1 to the virtual position of p2
                this.lines.push({
                    x1: p1.x - this.canvas.width * Math.round((p1.x - p2.x) / this.canvas.width),
                    y1: p1.y - this.canvas.height * Math.round((p1.y - p2.y) / this.canvas.height),
                    x2: p2.x,
                    y2: p2.y,
                    opacity: opacity,
                    distance: dist
                });
            } else if (isP2Virtual) {
                // Draw a single line from the actual position of p1 to the virtual position of p2
                this.lines.push({
                    x1: p1.x,
                    y1: p1.y,
                    x2: p2.x - this.canvas.width * Math.round((p2.x - p1.x) / this.canvas.width),
                    y2: p2.y - this.canvas.height * Math.round((p2.y - p1.y) / this.canvas.height),
                    opacity: opacity,
                    distance: dist
                });
            } else {
                this.lines.push({
                    x1: p1.x, y1: p1.y,
                    x2: p2.x, y2: p2.y,
                    opacity: opacity,
                    distance: dist
                });
            }
        }
    }
    
    draw() {
        const gl = this.gl;
        const canvas = this.canvas;
        
        // Clear canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Update viewport
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Draw particles
        if (this.particles.length > 0) {
            // Use pre-allocated arrays for better performance
            this.positions.length = 0;
            this.sizes.length = 0;
            this.colors.length = 0;
            
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                this.positions.push(p.x, p.y);
                this.sizes.push(p.radius * 2); // diameter
                this.colors.push(
                    p.color.r / 255,
                    p.color.g / 255,
                    p.color.b / 255,
                    p.opacity
                );
            }
            
            // Bind particle program
            gl.useProgram(this.program);
            
            // Set resolution
            gl.uniform2f(this.uniformLocations.resolution, canvas.width, canvas.height);
            
            // Bind position buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePositionBuffer);
            // Only reallocate buffer if size has changed
            if (this.positions.length * 4 > this.particlePositionBufferSize || !this.particlePositionBufferSize) {
                this.particlePositionBufferSize = this.positions.length * 4; // 4 bytes per float
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.DYNAMIC_DRAW);
            } else {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.positions));
            }
            gl.enableVertexAttribArray(this.attribLocations.position);
            gl.vertexAttribPointer(this.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
            
            // Bind size buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleSizeBuffer);
            // Only reallocate buffer if size has changed
            if (this.sizes.length * 4 > this.particleSizeBufferSize || !this.particleSizeBufferSize) {
                this.particleSizeBufferSize = this.sizes.length * 4; // 4 bytes per float
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.sizes), gl.DYNAMIC_DRAW);
            } else {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.sizes));
            }
            gl.enableVertexAttribArray(this.attribLocations.size);
            gl.vertexAttribPointer(this.attribLocations.size, 1, gl.FLOAT, false, 0, 0);
            
            // Bind color buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.particleColorBuffer);
            // Only reallocate buffer if size has changed
            if (this.colors.length * 4 > this.particleColorBufferSize || !this.particleColorBufferSize) {
                this.particleColorBufferSize = this.colors.length * 4; // 4 bytes per float
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.DYNAMIC_DRAW);
            } else {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.colors));
            }
            gl.enableVertexAttribArray(this.attribLocations.color);
            gl.vertexAttribPointer(this.attribLocations.color, 4, gl.FLOAT, false, 0, 0);
            
            // Draw particles
            gl.drawArrays(gl.POINTS, 0, this.particles.length);
        }
        
        // Draw lines
        if (this.lines.length > 0) {
            // Use pre-allocated arrays for better performance
            this.linePositions.length = 0;
            this.lineColors.length = 0;
            
            for (let i = 0; i < this.lines.length; i++) {
                const line = this.lines[i];
                this.linePositions.push(line.x1, line.y1, line.x2, line.y2);
                // Use line color from config or default to white
                const lineColor = this.hexToRgb(this.config.particles.line_linked.color);
                this.lineColors.push(
                    lineColor.r / 255,
                    lineColor.g / 255,
                    lineColor.b / 255,
                    line.opacity,
                    lineColor.r / 255,
                    lineColor.g / 255,
                    lineColor.b / 255,
                    line.opacity
                );
            }
            
            // Bind line program
            gl.useProgram(this.lineProgram);
            
            // Set resolution
            gl.uniform2f(this.uniformLocations.lineResolution, canvas.width, canvas.height);
            
            // Bind line position buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.linePositionBuffer);
            // Only reallocate buffer if size has changed
            if (this.linePositions.length * 4 > this.linePositionBufferSize || !this.linePositionBufferSize) {
                this.linePositionBufferSize = this.linePositions.length * 4; // 4 bytes per float
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.linePositions), gl.DYNAMIC_DRAW);
            } else {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.linePositions));
            }
            gl.enableVertexAttribArray(this.lineAttribLocations.position);
            gl.vertexAttribPointer(this.lineAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
            
            // Bind line color buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.lineColorBuffer);
            // Only reallocate buffer if size has changed
            if (this.lineColors.length * 4 > this.lineColorBufferSize || !this.lineColorBufferSize) {
                this.lineColorBufferSize = this.lineColors.length * 4; // 4 bytes per float
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.lineColors), gl.DYNAMIC_DRAW);
            } else {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.lineColors));
            }
            gl.enableVertexAttribArray(this.lineAttribLocations.color);
            gl.vertexAttribPointer(this.lineAttribLocations.color, 4, gl.FLOAT, false, 0, 0);
            
            // Draw lines
            gl.drawArrays(gl.LINES, 0, this.lines.length * 2);
        }
    }
    
    // Destroy method to clean up resources and stop animation
    destroy() {
        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('click', this.onClick);
        }
        
        // Clear particles and lines
        this.particles = [];
        this.lines = [];
        
        // Clear WebGL resources
        if (this.gl) {
            const gl = this.gl;
            
            // Delete buffers
            if (this.particlePositionBuffer) gl.deleteBuffer(this.particlePositionBuffer);
            if (this.particleSizeBuffer) gl.deleteBuffer(this.particleSizeBuffer);
            if (this.particleColorBuffer) gl.deleteBuffer(this.particleColorBuffer);
            if (this.linePositionBuffer) gl.deleteBuffer(this.linePositionBuffer);
            if (this.lineColorBuffer) gl.deleteBuffer(this.lineColorBuffer);
            
            // Delete programs
            if (this.program) gl.deleteProgram(this.program);
            if (this.lineProgram) gl.deleteProgram(this.lineProgram);
        }
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // Clear references
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.lineProgram = null;
        this.particlePositionBuffer = null;
        this.particleSizeBuffer = null;
        this.particleColorBuffer = null;
        this.linePositionBuffer = null;
        this.lineColorBuffer = null;
    }
}

// Global function to initialize WebGL particles
window.particlesJS = function(tag_id, params) {
    window.webglParticles = new WebGLParticles(tag_id, params);
};

// Load function for JSON config (similar to original particles.js)
window.particlesJS.load = function(tag_id, path_config_json, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', path_config_json);
    xhr.onreadystatechange = function(data) {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                const params = JSON.parse(data.currentTarget.response);
                window.particlesJS(tag_id, params);
                if (callback) callback();
            } else {
                console.log('Error pJS - XMLHttpRequest status: ' + xhr.status);
                console.log('Error pJS - File config not found');
            }
        }
    };
    xhr.send();
};
