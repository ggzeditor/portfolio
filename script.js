(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (reduceMotion) {
    document.getElementById('fallback').style.display = 'block';
    document.getElementById('viewport').style.display = 'none';
    document.querySelector('.scroll-progress').style.display = 'none';
    document.body.style.height = 'auto';
    return;
  }

  const camera = document.getElementById('camera');
  const scene = document.getElementById('scene');
  const progress = document.getElementById('progress');
  const nav = document.getElementById('nav');
  const heroVideo = document.getElementById('heroVideo');
  
  const TOTAL_Z = 16000;
  let currentZ = 0;
  let targetZ = 0;
  let mouseX = 0, mouseY = 0;
  let cameraX = 0, cameraY = 0;

  // Setup 3D elements
  const elements = Array.from(document.querySelectorAll('.threed-element')).map(el => {
    return {
      el,
      z: parseFloat(el.dataset.z || 0),
      x: parseFloat(el.dataset.x || 0),
      y: parseFloat(el.dataset.y || 0),
      ry: parseFloat(el.dataset.ry || 0),
      rx: parseFloat(el.dataset.rx || 0),
      scale: parseFloat(el.dataset.scale || 1),
      visible: true
    };
  });

  function setInitialTransforms() {
    const spread = Math.min(1, window.innerWidth / 1200);
    elements.forEach(item => {
      const cx = item.x * spread;
      const cy = item.y * spread;
      item.el.style.transform = `translate3d(calc(-50% + ${cx}px), calc(-50% + ${cy}px), ${item.z}px) rotateY(${item.ry}deg) rotateX(${item.rx}deg) scale(${item.scale})`;
    });
  }

  setInitialTransforms();
  window.addEventListener('resize', setInitialTransforms);

  // Mouse Parallax
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Render Loop
  function renderLoop() {
    const scrollable = Math.max(1, document.body.scrollHeight - window.innerHeight);
    targetZ = (window.scrollY / scrollable) * TOTAL_Z;
    
    // Smooth Z interpolation
    currentZ += (targetZ - currentZ) * 0.08;
    
    // Smooth Camera rotation
    cameraX += (mouseX * 4 - cameraX) * 0.05;
    cameraY += (mouseY * -4 - cameraY) * 0.05;
    
    // Apply transforms
    camera.style.transform = `rotateX(${cameraY}deg) rotateY(${cameraX}deg)`;
    scene.style.transform = `translate3d(0, 0, ${currentZ}px)`;
    
    // Update Progress Bar
    progress.style.width = `${(window.scrollY / scrollable) * 100}%`;
    
    // Nav styling
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    // Element Visibility & Fog
    elements.forEach(item => {
      const relZ = item.z + currentZ;
      let opacity = 1;

      if (relZ > 200) {
        opacity = 1 - (relZ - 200) / 500;
      } else if (relZ < -2500) {
        opacity = 1 - (-2500 - relZ) / 2500;
      }

      opacity = Math.max(0, Math.min(1, opacity));

      if (opacity <= 0.01) {
        if (item.visible) {
          item.el.style.visibility = 'hidden';
          item.visible = false;
        }
      } else {
        if (!item.visible) {
          item.el.style.visibility = 'visible';
          item.visible = true;
        }
        item.el.style.opacity = opacity.toFixed(3);
      }

      // Portfolio video autoplay logic
      const workCard = item.el.querySelector('.work-card');
      if (workCard) {
        const vid = workCard.querySelector('video');
        if (vid) {
          if (relZ > -4500 && relZ < 800) {
            if (!vid.getAttribute('src')) {
              vid.setAttribute('src', workCard.dataset.sample);
              vid.load();
            }
            if (vid.paused) {
              const playPromise = vid.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {});
              }
            }
          } else {
            if (!vid.paused) {
              vid.pause();
            }
          }
        }
      }
    });

    // Hero video play/pause based on visibility
    if (heroVideo) {
      const heroRelZ = -1500 + currentZ;
      // If hero video is within visible range (roughly -4000 to +1000 relZ)
      if (heroRelZ > -4000 && heroRelZ < 1000) {
        if (heroVideo.paused && heroVideo.readyState >= 2) {
          heroVideo.play().catch(() => {});
        }
      } else {
        if (!heroVideo.paused) {
          heroVideo.pause();
        }
      }
    }

    requestAnimationFrame(renderLoop);
  }
  
  requestAnimationFrame(renderLoop);

  // Lazy load Hero Video
  const loadHeroVideo = () => {
    if (!heroVideo) return;
    const source = heroVideo.querySelector('source[data-src]');
    if (!source || source.src) return;
    source.src = source.dataset.src;
    heroVideo.load();
    heroVideo.play().catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadHeroVideo, { timeout: 2000 });
  } else {
    setTimeout(loadHeroVideo, 1000);
  }

  // Navigation Links
  document.querySelectorAll('a[data-scroll]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const targetZAttr = parseFloat(btn.dataset.scroll);
      const scrollable = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const targetScrollY = (targetZAttr / TOTAL_Z) * scrollable;
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    });
  });

  // Modal Video Handling
  const modal = document.getElementById('modal');
  const modalVideo = document.getElementById('modalVideo');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');

  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('click', () => {
      const src = card.dataset.sample;
      const title = card.dataset.title;
      if (!src) return;
      
      modalTitle.textContent = title;
      modalVideo.src = src;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modalVideo.play().catch(() => {});
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

})();
