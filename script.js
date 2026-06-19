/**
 * Dhanushree's Portfolio - Main JavaScript
 * Contains 10+ required JavaScript functions to power interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Typing Effect Function ---
    function initTypingEffect() {
        const textElement = document.getElementById('typing-text');
        const roles = ["Web Developer", "Problem Solver", "Creative Thinker"];
        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingDelay = 100;

        function type() {
            const currentRole = roles[roleIndex];
            
            if (isDeleting) {
                textElement.textContent = currentRole.substring(0, charIndex - 1);
                charIndex--;
                typingDelay = 50; // Faster when deleting
            } else {
                textElement.textContent = currentRole.substring(0, charIndex + 1);
                charIndex++;
                typingDelay = 100;
            }

            if (!isDeleting && charIndex === currentRole.length) {
                isDeleting = true;
                typingDelay = 1500; // Pause at the end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typingDelay = 500; // Pause before typing new word
            }

            setTimeout(type, typingDelay);
        }
        
        if (textElement) type();
    }

    // --- 2. Parallax Function ---
    function initParallaxHero() {
        document.addEventListener('mousemove', (e) => {
            const layers = document.querySelectorAll('.parallax-layer');
            const x = (e.clientX * 100) / window.innerWidth;
            const y = (e.clientY * 100) / window.innerHeight;

            layers.forEach(layer => {
                const speed = layer.getAttribute('data-speed');
                const xOffset = (window.innerWidth / 2 - e.pageX) * speed / 100;
                const yOffset = (window.innerHeight / 2 - e.pageY) * speed / 100;
                
                layer.style.transform = `translateX(${xOffset}px) translateY(${yOffset}px)`;
            });
        });
    }

    // --- 3. Floating Profile Animation Function ---
    function animateProfileFloating() {
        const profile = document.getElementById('profile-card');
        if (!profile) return;
        
        let startTime = Date.now();
        
        function float() {
            const time = Date.now() - startTime;
            // Calculate sine wave for smooth up/down motion
            const y = Math.sin(time / 1000) * 15; // 15px max float distance
            
            // Only apply translate, preserve other transforms if any
            profile.style.transform = `translateY(${y}px)`;
            
            requestAnimationFrame(float);
        }
        
        float();
    }

    // --- 4. Glow Animation Function ---
    function pulseGlowEffect() {
        const glow = document.getElementById('dynamic-glow');
        if (!glow) return;

        let startTime = Date.now();
        
        function pulse() {
            const time = Date.now() - startTime;
            // Oscillate opacity between 0.4 and 0.9
            const opacity = 0.4 + (Math.sin(time / 800) + 1) / 2 * 0.5;
            // Oscillate blur radius
            const blur = 20 + (Math.sin(time / 600) + 1) / 2 * 10;
            
            glow.style.opacity = opacity;
            glow.style.filter = `blur(${blur}px)`;
            
            requestAnimationFrame(pulse);
        }
        
        pulse();
    }

    // --- 5. Scroll Reveal Function ---
    function initScrollReveal() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // If it's the stats section, animate numbers
                    if (entry.target.id === 'about') {
                        animateNumbers();
                    }
                    
                    // If it's skills section, animate bars
                    if (entry.target.id === 'skills') {
                        animateSkillBars();
                    }
                    
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.scroll-reveal');
        revealElements.forEach(el => observer.observe(el));
    }

    // Number animation helper for stats
    function animateNumbers() {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const target = +stat.getAttribute('data-target');
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps approx
            let current = 0;

            function updateCounter() {
                current += increment;
                if (current < target) {
                    stat.innerText = Math.ceil(current) + (target > 50 ? '+' : '+');
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.innerText = target + '+';
                }
            }
            updateCounter();
        });
    }

    // --- 6. Skill Bar Animation Function ---
    function animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-bar-fill');
        skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            // Small delay for staggered effect
            setTimeout(() => {
                bar.style.width = width;
            }, 300);
        });
    }

    // --- 7. Card Tilt Function (3D Hover) ---
    function initCardTilt() {
        const cards = document.querySelectorAll('.tilt-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                const y = e.clientY - rect.top;  // y position within the element
                
                // Calculate rotation based on cursor position
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                // Reset transformation
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                card.style.transition = 'transform 0.5s ease';
            });
            
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'none';
            });
        });
    }

    // --- 8. Modal Function ---
    function handleProjectModals() {
        const modal = document.getElementById('project-modal');
        const modalBody = document.getElementById('modal-body-content');
        const closeBtn = document.querySelector('.close-modal');
        const openBtns = document.querySelectorAll('.open-modal-btn');

        // Project Data
        const projectsData = {
            "1": {
                title: "💰 Expense Tracker — Finance App",
                desc: "A smart personal finance app inspired by modern fintech UI. Features a real-time balance dashboard, income vs expense summary, interactive donut charts for category breakdowns (Groceries, Clothing, Travel, etc.), savings goals with progress bars, and a detailed transaction history — all stored in localStorage for instant access.",
                tech: ["HTML", "CSS", "JavaScript", "Chart.js", "LocalStorage"],
                live: "#",
                github: "#",
                image: "project1.jpg"
            },
            "2": {
                title: "🔐 Attendance Tracker — Biometric System",
                desc: "An AI-powered biometric attendance system leveraging facial recognition technology integrated with Firebase Realtime Database. Features include one-tap face scan attendance marking, live attendance dashboard, daily/weekly/monthly report generation, and secure cloud data sync. Built to replace manual registers with a futuristic, contactless solution.",
                tech: ["HTML/CSS", "JavaScript", "Firebase", "Face API", "Biometric"],
                live: "#",
                github: "#",
                image: "project2.jpg"
            },
            "3": {
                title: "🌐 Portfolio Website — Personal Showcase",
                desc: "A stunning, highly interactive personal portfolio built from scratch. Features 10+ custom JavaScript functions, a WebGL floating-lines background, custom neon cursor, smooth scroll animations, glassmorphism cards, 3D tilt hover effects, theme toggle (dark/light), animated skill bars, typing effect, and a scroll progress bar.",
                tech: ["HTML", "CSS", "JavaScript", "WebGL", "GSAP", "Canvas API"],
                live: "#",
                github: "#",
                image: "project3.jpg"
            }
        };

        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.target.getAttribute('data-project');
                const data = projectsData[projectId];
                
                // Generate tech badges html
                const badgesHtml = data.tech.map(t => `<span>${t}</span>`).join('');
                
                // Inject content
                modalBody.innerHTML = `
                    <h2>${data.title}</h2>
                    <p>${data.desc}</p>
                    <div class="tech-badges">${badgesHtml}</div>
                    <div class="modal-actions">
                        <a href="${data.live}" class="btn btn-primary" target="_blank">Live Demo</a>
                        <a href="${data.github}" class="btn btn-outline" target="_blank">GitHub</a>
                    </div>
                `;
                
                // Show modal
                modal.classList.add('show');
            });
        });

        // Close modal logic
        function closeModal() {
            modal.classList.remove('show');
        }

        closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // --- 9. Form Validation Function ---
    function validateContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            
            // Name validation
            const nameInput = document.getElementById('name');
            const nameGroup = nameInput.parentElement;
            if (nameInput.value.trim() === '') {
                nameGroup.classList.add('error');
                isValid = false;
            } else {
                nameGroup.classList.remove('error');
            }

            // Email validation (Regex)
            const emailInput = document.getElementById('email');
            const emailGroup = emailInput.parentElement;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                emailGroup.classList.add('error');
                isValid = false;
            } else {
                emailGroup.classList.remove('error');
            }

            // Message validation
            const msgInput = document.getElementById('message');
            const msgGroup = msgInput.parentElement;
            if (msgInput.value.trim() === '') {
                msgGroup.classList.add('error');
                isValid = false;
            } else {
                msgGroup.classList.remove('error');
            }

            if (isValid) {
                // Trigger success animation
                showSubmitAnimation(form);
            }
        });
    }

    // --- 10. Submit Animation Function ---
    function showSubmitAnimation(form) {
        const btn = form.querySelector('.submit-btn');
        const originalText = btn.innerHTML;
        const successMsg = document.getElementById('form-success');
        
        // Button loading state
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            // Restore button
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            // Show success message
            successMsg.style.display = 'block';
            
            // Clear form
            form.reset();
            
            // Hide success message after 4s
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 4000);
            
        }, 1500);
    }

    // --- 11. Smooth Scroll & Active Nav Function ---
    function initSmoothScrollAndNav() {
        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // offset for fixed navbar
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Highlight active nav section on scroll
        window.addEventListener('scroll', handleNavbarHighlight);
    }

    // Helper for nav highlight
    function handleNavbarHighlight() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const currentId = section.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });

        // Navbar solid background on scroll
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // --- 12. Scroll Progress Bar Function ---
    function updateScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        });
    }

    // --- 13. Custom Cursor Function ---
    function initCustomCursor() {
        const cursor = document.getElementById('custom-cursor');
        const follower = document.getElementById('custom-cursor-follower');
        
        document.addEventListener('mousemove', (e) => {
            // Update main dot instantly
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            // Update follower with slight delay using requestAnimationFrame
            follower.style.left = e.clientX + 'px';
            follower.style.top = e.clientY + 'px';
        });

        // Add hover effect on clickable elements
        const clickables = document.querySelectorAll('a, button, .tilt-card, .tool-item');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    }

    // --- 14. Loader Animation Function ---
    function hideLoaderAnimation() {
        const loader = document.getElementById('loader');
        // Add artificial delay to show loader animation
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            // Start animations after load
            initTypingEffect();
        }, 1500);
    }

    // --- 15. Dynamic Footer Year ---
    function updateFooterYear() {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear(); // Or specifically 2026 as requested: yearSpan.textContent = "2026";
            // User requested "© 2026 Dhanushree", let's use JS to set it to current year or hardcode to 2026 if needed.
            // Using dynamic current year is better practice, but let's default it to 2026 if it's currently earlier.
            const year = new Date().getFullYear();
            yearSpan.textContent = year > 2026 ? year : 2026; 
        }
    }

    // --- 16. Animated Hexagon Grid (Canvas) ---
    function initHexagonGrid() {
        const canvas = document.getElementById('hex-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width, height;
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        
        window.addEventListener('resize', resize);
        resize();

        let time = 0;
        const hexSize = 40; // size of hexagon

        function drawHexagon(x, y, size, opacity) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            
            // We use the computed css variable neon-blue color for stroke
            const computedStyle = getComputedStyle(document.documentElement);
            const neonBlue = computedStyle.getPropertyValue('--neon-blue').trim() || '#00f0ff';
            
            ctx.strokeStyle = neonBlue;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            time += 0.01;
            const hexHeight = Math.sqrt(3) * hexSize;
            const hexWidth = 2 * hexSize;
            const vertDist = hexHeight;
            const horizDist = hexWidth * 0.75;
            
            for (let y = 0; y < height + hexHeight; y += vertDist) {
                for (let x = 0, row = 0; x < width + hexWidth; x += horizDist, row++) {
                    const yOffset = (row % 2 === 1) ? hexHeight / 2 : 0;
                    
                    // Create a wave effect for opacity
                    const noise = Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 + time);
                    const opacity = Math.max(0.02, 0.15 + noise * 0.1);
                    
                    drawHexagon(x, y + yOffset, hexSize - 2, opacity);
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

    // --- 17. Theme Toggle Function ---
    function initThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;
        const icon = toggleBtn.querySelector('i');
        const root = document.documentElement;

        // Check local storage
        const savedTheme = localStorage.getItem('portfolio-theme');
        if (savedTheme === 'light') {
            root.setAttribute('data-theme', 'light');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }

        toggleBtn.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            let newTheme = 'dark';
            
            if (currentTheme === 'light') {
                root.removeAttribute('data-theme');
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                newTheme = 'dark';
            } else {
                root.setAttribute('data-theme', 'light');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                newTheme = 'light';
            }
            
            localStorage.setItem('portfolio-theme', newTheme);
            
            // Dispatch event for WebGL background to update its colors
            window.dispatchEvent(new Event('themeChanged'));
        });
    }

    // --- 18. Lightfall WebGL Background Function ---
    // --- 18. Lightfall WebGL Background Function (Pure WebGL) ---
    function initLightfall() {
        const container = document.getElementById('lightfall-container');
        if (!container) return;

        const MAX_COLORS = 8;
        const hexToRGB = hex => {
            const c = hex.replace('#', '').padEnd(6, '0');
            const r = parseInt(c.slice(0, 2), 16) / 255;
            const g = parseInt(c.slice(2, 4), 16) / 255;
            const b = parseInt(c.slice(4, 6), 16) / 255;
            return [r, g, b];
        };

        const prepColors = input => {
            const base = (input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS);
            const count = base.length;
            const arr = [];
            for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
            const avg = [0, 0, 0];
            for (let i = 0; i < count; i++) {
                avg[0] += arr[i][0];
                avg[1] += arr[i][1];
                avg[2] += arr[i][2];
            }
            avg[0] /= count;
            avg[1] /= count;
            avg[2] /= count;
            return { arr, count, avg };
        };

        const vertexSrc = `
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentSrc = `
            precision highp float;

            uniform vec3  iResolution;
            uniform vec2  iMouse;
            uniform float iTime;

            uniform vec3  uColor0;
            uniform vec3  uColor1;
            uniform vec3  uColor2;
            uniform vec3  uColor3;
            uniform vec3  uColor4;
            uniform vec3  uColor5;
            uniform vec3  uColor6;
            uniform vec3  uColor7;
            uniform int   uColorCount;

            uniform vec3  uBgColor;
            uniform vec3  uMouseColor;
            uniform float uSpeed;
            uniform int   uStreakCount;
            uniform float uStreakWidth;
            uniform float uStreakLength;
            uniform float uGlow;
            uniform float uDensity;
            uniform float uTwinkle;
            uniform float uZoom;
            uniform float uBgGlow;
            uniform float uOpacity;
            uniform float uMouseEnabled;
            uniform float uMouseStrength;
            uniform float uMouseRadius;

            varying vec2 vUv;

            vec3 palette(float h) {
                int count = uColorCount;
                if (count < 1) count = 1;
                int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
                if (idx <= 0) return uColor0;
                if (idx == 1) return uColor1;
                if (idx == 2) return uColor2;
                if (idx == 3) return uColor3;
                if (idx == 4) return uColor4;
                if (idx == 5) return uColor5;
                if (idx == 6) return uColor6;
                return uColor7;
            }

            vec3 tanhv(vec3 x) {
                vec3 e = exp(-2.0 * x);
                return (1.0 - e) / (1.0 + e);
            }

            vec2 sceneC(vec2 frag, vec2 r) {
                vec2 P = (frag + frag - r) / r.x;
                float z = 0.0;
                float d = 1e3;
                vec4 O = vec4(0.0);
                for (int k = 0; k < 39; k++) {
                    if (d <= 1e-4) break;
                    O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
                    d = 1.0 - sqrt(length(O * O));
                    z += d;
                }
                return vec2(O.x, atan(O.z, O.y));
            }

            void mainImage(out vec4 o, vec2 C) {
                vec2 r = iResolution.xy;
                vec2 uv0 = (C + C - r) / r.x;
                float T = 0.1 * iTime * uSpeed + 9.0;
                float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
                vec2 Y = vec2(5e-3, 6.28318530718 / angRings);

                vec2 c0 = sceneC(C, r);
                vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
                vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
                vec2 dCx = cdx - c0;
                vec2 dCy = cdy - c0;
                dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
                dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
                vec2 fw = abs(dCx) + abs(dCy);
                C = c0;

                vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
                vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);

                float mGlow = 0.0;
                if (uMouseEnabled > 0.5) {
                    vec2 mN = (iMouse + iMouse - r) / r.x;
                    float md = length(uv0 - mN);
                    mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
                    O.rgb += uMouseColor * mGlow * 0.25;
                }

                float zr = 5e-4 * uStreakWidth;
                vec2 rr = vec2(max(length(fw), 1e-5));
                float tail = 19.0 / max(uStreakLength, 0.05);

                for (int m = 0; m < 16; m++) {
                    if (m >= uStreakCount) break;
                    float jf = float(m) + 1.0;
                    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
                    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
                    Pp -= floor(Pp / Y + 0.5) * Y;
                    float h = fract(8663.0 * ic);
                    vec3 col = palette(h);
                    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
                    weight *= (1.0 + mGlow * 2.0);
                    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
                    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
                    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
                    C.x += Y.x / 8.0;
                }

                vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
                o = vec4(colr, uOpacity);
            }

            void main() {
                vec4 color;
                mainImage(color, vUv * iResolution.xy);
                gl_FragColor = color;
            }
        `;

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        container.appendChild(canvas);

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        // Setup shaders
        function compileShader(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSrc);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Setup geometry (fullscreen quad)
        const vertices = new Float32Array([
            -1, -1,  0, 0,
             1, -1,  1, 0,
            -1,  1,  0, 1,
             1,  1,  1, 1
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLoc = gl.getAttribLocation(program, 'position');
        const uvLoc = gl.getAttribLocation(program, 'uv');

        const FSIZE = vertices.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, FSIZE * 4, 0);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
        gl.enableVertexAttribArray(uvLoc);

        // Props mapping
        const colors = ['#284633', '#27d8ff', '#9ffffb', '#A6C8FF', '#5227FF', '#FF9FFC'];
        const backgroundColor = '#0A29FF'; 
        const speed = 0.3;
        const streakCount = 8;
        const streakWidth = 0.8;
        const streakLength = 1.4;
        const glow = 1.1;
        const density = 0.4;
        const twinkle = 0.35;
        const zoom = 3.7;
        const backgroundGlow = 2.6;
        const opacity = 1;
        const mouseInteraction = false;
        const mouseStrength = 1;
        const mouseRadius = 0.8;

        const { arr, count, avg } = prepColors(colors);

        gl.useProgram(program);

        // Set uniforms
        function setUniform3f(name, v) { gl.uniform3f(gl.getUniformLocation(program, name), v[0], v[1], v[2]); }
        function setUniform1f(name, v) { gl.uniform1f(gl.getUniformLocation(program, name), v); }
        function setUniform1i(name, v) { gl.uniform1i(gl.getUniformLocation(program, name), v); }
        function setUniform2f(name, v1, v2) { gl.uniform2f(gl.getUniformLocation(program, name), v1, v2); }

        const updateLightfallTheme = () => {
            const currentBgDark = getComputedStyle(document.documentElement).getPropertyValue('--bg-dark').trim();
            const currentPurple = getComputedStyle(document.documentElement).getPropertyValue('--neon-purple').trim();
            const currentBlue = getComputedStyle(document.documentElement).getPropertyValue('--neon-blue').trim();

            const finalBgColor = currentBgDark ? hexToRGB(currentBgDark) : hexToRGB(backgroundColor);
            
            // Re-prep colors based on the current theme variables
            const themeColorsArr = [
                currentBlue || '#27d8ff', 
                currentPurple || '#9ffffb', 
                '#A6C8FF', '#5227FF', '#FF9FFC', '#284633'
            ];
            
            const currentPrep = prepColors(themeColorsArr);

            setUniform3f('uColor0', currentPrep.arr[0]);
            setUniform3f('uColor1', currentPrep.arr[1]);
            setUniform3f('uColor2', currentPrep.arr[2]);
            setUniform3f('uColor3', currentPrep.arr[3]);
            setUniform3f('uColor4', currentPrep.arr[4] || currentPrep.arr[0]);
            setUniform3f('uColor5', currentPrep.arr[5] || currentPrep.arr[0]);
            setUniform3f('uColor6', currentPrep.arr[6] || currentPrep.arr[0]);
            setUniform3f('uColor7', currentPrep.arr[7] || currentPrep.arr[0]);
            setUniform1i('uColorCount', currentPrep.count);
            
            setUniform3f('uBgColor', finalBgColor);
            setUniform3f('uMouseColor', currentPrep.avg);
        };

        // Initial setup
        updateLightfallTheme();
        
        // Listen for theme changes from toggle
        window.addEventListener('themeChanged', () => {
            // Small timeout to allow CSS variables to update first
            setTimeout(updateLightfallTheme, 50);
        });

        setUniform1f('uSpeed', speed);
        setUniform1i('uStreakCount', Math.max(1, Math.min(16, Math.round(streakCount))));
        setUniform1f('uStreakWidth', streakWidth);
        setUniform1f('uStreakLength', streakLength);
        setUniform1f('uGlow', glow);
        setUniform1f('uDensity', density);
        setUniform1f('uTwinkle', twinkle);
        setUniform1f('uZoom', zoom);
        setUniform1f('uBgGlow', backgroundGlow);
        setUniform1f('uOpacity', opacity);
        setUniform1f('uMouseEnabled', mouseInteraction ? 1.0 : 0.0);
        setUniform1f('uMouseStrength', mouseStrength);
        setUniform1f('uMouseRadius', mouseRadius);

        const resolutionLoc = gl.getUniformLocation(program, 'iResolution');
        const timeLoc = gl.getUniformLocation(program, 'iTime');
        const mouseLoc = gl.getUniformLocation(program, 'iMouse');

        const dpr = window.devicePixelRatio || 1;
        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform3f(resolutionLoc, canvas.width, canvas.height, 1.0);
        };

        window.addEventListener('resize', resize);
        resize();

        let mouseTarget = [0, 0];
        let currentMouse = [0, 0];

        if (mouseInteraction) {
            canvas.addEventListener('pointermove', e => {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * dpr;
                const y = (rect.height - (e.clientY - rect.top)) * dpr;
                mouseTarget = [x, y];
            });
        }

        let lastTime = 0;
        const loop = t => {
            requestAnimationFrame(loop);
            const dt = (t - lastTime) / 1000;
            lastTime = t;

            gl.uniform1f(timeLoc, t * 0.001);

            if (mouseInteraction) {
                const tau = 0.15;
                let factor = 1 - Math.exp(-dt / tau);
                if (factor > 1) factor = 1;
                currentMouse[0] += (mouseTarget[0] - currentMouse[0]) * factor;
                currentMouse[1] += (mouseTarget[1] - currentMouse[1]) * factor;
                gl.uniform2f(mouseLoc, currentMouse[0], currentMouse[1]);
            }

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        requestAnimationFrame(loop);
    }

    // --- 19. Electric Border Function (Pure JS + Canvas) ---
    function initElectricBorder(cardElement) {
        // Wrap card
        const wrapper = document.createElement('div');
        wrapper.className = 'electric-border';
        
        cardElement.parentNode.insertBefore(wrapper, cardElement);
        wrapper.appendChild(cardElement);

        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'eb-canvas-container';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'eb-canvas';
        canvasContainer.appendChild(canvas);
        wrapper.appendChild(canvasContainer);

        // Glow layers
        const glowLayers = document.createElement('div');
        glowLayers.className = 'eb-layers';
        glowLayers.innerHTML = `
            <div class="eb-glow-1"></div>
            <div class="eb-glow-2"></div>
            <div class="eb-background-glow"></div>
        `;
        wrapper.insertBefore(glowLayers, cardElement); // Put behind the card
        
        cardElement.classList.add('eb-content');

        // State & Config
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;
        let lastFrameTime = null;
        let speed = 1;
        let baseSpeed = 1;
        let chaos = 0.12;
        let baseChaos = 0.12;
        const borderRadius = 16;
        
        const octaves = 10;
        const lacunarity = 1.6;
        const gain = 0.7;
        let amplitude = chaos;
        const frequency = 10;
        const baseFlatness = 0;
        const displacement = 60;
        const borderOffset = 60;
        
        // Noise functions
        const random = x => (Math.sin(x * 12.9898) * 43758.5453) % 1;
        
        const noise2D = (x, y) => {
            const i = Math.floor(x);
            const j = Math.floor(y);
            const fx = x - i;
            const fy = y - j;
            const a = random(i + j * 57);
            const b = random(i + 1 + j * 57);
            const c = random(i + (j + 1) * 57);
            const d = random(i + 1 + (j + 1) * 57);
            const ux = fx * fx * (3.0 - 2.0 * fx);
            const uy = fy * fy * (3.0 - 2.0 * fy);
            return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
        };

        const octavedNoise = (x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) => {
            let y = 0;
            let amp = baseAmplitude;
            let freq = baseFrequency;
            for (let i = 0; i < octaves; i++) {
                let octaveAmplitude = amp;
                if (i === 0) octaveAmplitude *= baseFlatness;
                y += octaveAmplitude * noise2D(freq * x + seed * 100, time * freq * 0.3);
                freq *= lacunarity;
                amp *= gain;
            }
            return y;
        };

        const getCornerPoint = (centerX, centerY, radius, startAngle, arcLength, progress) => {
            const angle = startAngle + progress * arcLength;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        };

        const getRoundedRectPoint = (t, left, top, width, height, radius) => {
            const straightWidth = width - 2 * radius;
            const straightHeight = height - 2 * radius;
            const cornerArc = (Math.PI * radius) / 2;
            const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
            const distance = t * totalPerimeter;

            let accumulated = 0;
            if (distance <= accumulated + straightWidth) {
                const progress = (distance - accumulated) / straightWidth;
                return { x: left + radius + progress * straightWidth, y: top };
            }
            accumulated += straightWidth;

            if (distance <= accumulated + cornerArc) {
                const progress = (distance - accumulated) / cornerArc;
                return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
            }
            accumulated += cornerArc;

            if (distance <= accumulated + straightHeight) {
                const progress = (distance - accumulated) / straightHeight;
                return { x: left + width, y: top + radius + progress * straightHeight };
            }
            accumulated += straightHeight;

            if (distance <= accumulated + cornerArc) {
                const progress = (distance - accumulated) / cornerArc;
                return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
            }
            accumulated += cornerArc;

            if (distance <= accumulated + straightWidth) {
                const progress = (distance - accumulated) / straightWidth;
                return { x: left + width - radius - progress * straightWidth, y: top + height };
            }
            accumulated += straightWidth;

            if (distance <= accumulated + cornerArc) {
                const progress = (distance - accumulated) / cornerArc;
                return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
            }
            accumulated += cornerArc;

            if (distance <= accumulated + straightHeight) {
                const progress = (distance - accumulated) / straightHeight;
                return { x: left, y: top + height - radius - progress * straightHeight };
            }
            accumulated += straightHeight;

            const progress = (distance - accumulated) / cornerArc;
            return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
        };

        let canvasWidth, canvasHeight;
        
        function updateCanvasSize() {
            const rect = wrapper.getBoundingClientRect();
            canvasWidth = rect.width + borderOffset * 2;
            canvasHeight = rect.height + borderOffset * 2;
            
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = canvasWidth * dpr;
            canvas.height = canvasHeight * dpr;
            canvas.style.width = `${canvasWidth}px`;
            canvas.style.height = `${canvasHeight}px`;
            ctx.scale(dpr, dpr);
        }
        
        let lastDpr = Math.min(window.devicePixelRatio || 1, 2);
        updateCanvasSize();
        
        const resizeObserver = new ResizeObserver(updateCanvasSize);
        resizeObserver.observe(wrapper);

        // Render loop
        function animateBorder(currentTime) {
            if (lastFrameTime === null) lastFrameTime = currentTime;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            if (dpr !== lastDpr) {
                lastDpr = dpr;
                updateCanvasSize();
            }

            const deltaTime = (currentTime - lastFrameTime) / 1000;
            time += deltaTime * speed;
            lastFrameTime = currentTime;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(dpr, dpr);

            // Fetch latest color in case theme changed
            const currentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-blue').trim() || '#06B6D4';

            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 2; // thickness
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const scale = displacement;
            const left = borderOffset;
            const top = borderOffset;
            const innerWidth = canvasWidth - 2 * borderOffset;
            const innerHeight = canvasHeight - 2 * borderOffset;
            const maxRadius = Math.min(innerWidth, innerHeight) / 2;
            const r = Math.min(borderRadius, maxRadius);

            const approximatePerimeter = 2 * (innerWidth + innerHeight) + 2 * Math.PI * r;
            const sampleCount = Math.floor(approximatePerimeter / 2);

            ctx.beginPath();
            for (let i = 0; i <= sampleCount; i++) {
                const progress = i / sampleCount;
                const point = getRoundedRectPoint(progress, left, top, innerWidth, innerHeight, r);

                const xNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 0, baseFlatness);
                const yNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 1, baseFlatness);

                const displacedX = point.x + xNoise * scale;
                const displacedY = point.y + yNoise * scale;

                if (i === 0) {
                    ctx.moveTo(displacedX, displacedY);
                } else {
                    ctx.lineTo(displacedX, displacedY);
                }
            }
            ctx.closePath();
            ctx.stroke();
            
            // Apply glow
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset

            animationFrameId = requestAnimationFrame(animateBorder);
        }

        animationFrameId = requestAnimationFrame(animateBorder);

        // Hover effects
        wrapper.addEventListener('mouseenter', () => {
            speed = baseSpeed * 3; // faster on hover
            amplitude = baseChaos * 1.5; // more chaotic
            wrapper.style.setProperty('--electric-hover-opacity', '0.4');
        });

        wrapper.addEventListener('mouseleave', () => {
            speed = baseSpeed;
            amplitude = baseChaos;
            wrapper.style.setProperty('--electric-hover-opacity', '0.15');
        });
        
        // Theme Update Listener
        const updateColorVar = () => {
            wrapper.style.setProperty('--electric-border-color', 'var(--neon-blue)');
        };
        updateColorVar();
        window.addEventListener('themeChanged', () => {
            setTimeout(updateColorVar, 50);
        });
    }

    // --- Initialize All Functions ---
    initThemeToggle(); // 17
    hideLoaderAnimation(); // 14
    initCustomCursor(); // 13
    updateScrollProgress(); // 12
    initSmoothScrollAndNav(); // 11
    initParallaxHero(); // 2
    animateProfileFloating(); // 3
    pulseGlowEffect(); // 4
    initScrollReveal(); // 5
    initCardTilt(); // 7
    handleProjectModals(); // 8
    validateContactForm(); // 9
    updateFooterYear(); // 15
    // initHexagonGrid(); // 16 - Moved to backgroundSystem.js
    // initLightfall(); // 18 WebGL Background - Moved to backgroundSystem.js
    
    // 20. Add Electric Borders
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => initElectricBorder(card));
});
