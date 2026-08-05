
        (function() {
            // ============ DOM ELEMENTS ============
            const cursorDot=null;
            const cursorRing=null;
            const particlesCanvas = document.getElementById('particles-canvas');
            const ctx = particlesCanvas.getContext('2d');
            const nav = document.getElementById('nav');
            const modalOverlay = document.getElementById('modalOverlay');
            const modalVideo = document.getElementById('modalVideo');
            const modalClose = document.getElementById('modalClose');
            const modalContainer = document.getElementById('modalContainer');
            const workCards = document.querySelectorAll('.work-card');
            const revealElements = document.querySelectorAll('.reveal');
            const allInteractive = document.querySelectorAll(
                'a, button, .btn, .work-card, .contact-card, .pricing-btn, .back-to-top, .modal-close');

            // ============ STATE ============
            let mouseX = window.innerWidth / 2;
            let mouseY = window.innerHeight / 2;
            let cursorX = mouseX;
            let cursorY = mouseY;
            let ringX = mouseX;
            let ringY = mouseY;
            let isHoveringInteractive = false;
            let isMagnetic = false;
            let magneticTarget = null;
            let currentSample = '';
            let particles = [];
            const PARTICLE_COUNT = 20;

            // ============ MOBILE CHECK ============
            const isMobile = () => window.innerWidth <= 768;

            // cursor removed

            // ============ PARTICLES ============
            function resizeCanvas() {
                particlesCanvas.width = window.innerWidth;
                particlesCanvas.height = window.innerHeight;
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            function createParticles() {
                particles = [];
                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    particles.push({
                        x: Math.random() * particlesCanvas.width,
                        y: Math.random() * particlesCanvas.height,
                        radius: Math.random() * 1.5 + 0.5,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3 - 0.1,
                        alpha: Math.random() * 0.5 + 0.2,
                        pulse: Math.random() * Math.PI * 2,
                        pulseSpeed: Math.random() * 0.02 + 0.005,
                    });
                }
            }
            createParticles();
            window.addEventListener('resize', createParticles);

            function drawParticles() {
                ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.pulse += p.pulseSpeed;

                    if (p.x < -20) p.x = particlesCanvas.width + 20;
                    if (p.x > particlesCanvas.width + 20) p.x = -20;
                    if (p.y < -20) p.y = particlesCanvas.height + 20;
                    if (p.y > particlesCanvas.height + 20) p.y = -20;

                    const alpha = p.alpha + Math.sin(p.pulse) * 0.2;
                    const glowAlpha = Math.max(0, alpha - 0.15);

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(99,255,74,${glowAlpha * 0.25})`;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(180,255,160,${Math.max(0.08, alpha)})`;
                    ctx.fill();
                });

                // Draw subtle connections between nearby particles
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 100) {
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.strokeStyle = `rgba(99,255,74,${0.03 * (1 - dist / 100)})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }

            // ============ NAVIGATION ============
            function updateNavScroll() {
                if (window.scrollY > 60) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
            window.addEventListener('scroll', updateNavScroll, { passive: true });

            // ============ SCROLL REVEAL ============
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -60px 0px',
                threshold: 0.1,
            };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            revealElements.forEach(el => {
                observer.observe(el);
            });

            // ============ WORK CARDS - HOVER PLAY ============
            workCards.forEach(card => {
                const video = card.querySelector('video');
                card.addEventListener('mouseenter',()=>{if(video&&video.src){video.currentTime=0;video.play().catch(()=>{});}});
                card.addEventListener('mouseleave', () => {
                    if (video) {
                       
                    }
                });
                // Click to open modal
                card.addEventListener('click', () => {
                    const sampleSrc = card.getAttribute('data-sample');
                    const title = card.getAttribute('data-title');
                    if (sampleSrc) {
                        openModal(sampleSrc, title);
                    }
                });
            });

            // ============ MODAL ============
            function openModal(src, title) {
                currentSample = src;
                modalVideo.querySelector('source').src = src;
                modalVideo.load();
                modalVideo.play().catch(() => {});
                modalOverlay.classList.add('active');
                modalOverlay.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modal-open');
                document.getElementById('modalVideo').setAttribute('title', title || 'Video Preview');
            }

            function closeModal() {
                modalOverlay.classList.remove('active');
                modalOverlay.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('modal-open');
                modalVideo.pause();
                modalVideo.querySelector('source').src = '';
                modalVideo.load();
                currentSample = '';
            }

            modalClose.addEventListener('click', closeModal);
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
                    closeModal();
                }
            });

            // ============ SMOOTH SCROLL FOR NAV ============
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    const target = document.querySelector(targetId);
                    if (target) {
                        e.preventDefault();
                        const navHeight = nav.offsetHeight + 20;
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset -
                            navHeight;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth',
                        });
                    }
                });
            });

            // ============ BACK TO TOP ============
            document.querySelector('.back-to-top').addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // ============ ANIMATION LOOP ============
            function animate() {
                
                drawParticles();
                requestAnimationFrame(animate);
            }
            animate();

            // ============ INITIAL NAV STATE ============
            updateNavScroll();

            // ============ HANDLE WINDOW RESIZE FOR CURSOR ============
            window.addEventListener('resize', () => {
                if (isMobile()) {
                    cursorDot.style.display = 'none';
                    cursorRing.style.display = 'none';
                } else {
                    cursorDot.style.display = 'block';
                    cursorRing.style.display = 'block';
                }
            });

            // Initial cursor state
            if (isMobile()) {
                cursorDot.style.display = 'none';
                cursorRing.style.display = 'none';
            }

            console.log('%c GGZ EDITOR %c Portfolio Ready ',
                'background:#63FF4A;color:#070707;padding:6px 12px;border-radius:4px;font-weight:700;font-size:14px;',
                'color:#9C9C9C;');
            console.log('%c Premium Cinematic Minecraft Editing %c ✦ ',
                'color:#fff;font-size:12px;', 'color:#63FF4A;');
        })();
    