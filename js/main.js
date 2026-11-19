/* =========================================================
   ASOCIACIÓN EVA HISTÓRICA — Interacciones
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Imágenes faltantes: muestra un respaldo bonito ---------- */
  const markMissing = (img) => {
    img.parentElement.classList.add('no-img');
    img.style.display = 'none';
  };
  document.querySelectorAll('img.js-fallback').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    else img.addEventListener('error', () => markMissing(img), { once: true });
  });

  /* ---------- Encabezado: sombra al hacer scroll ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('menu-principal');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Slider de banners ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const slides = [...hero.querySelectorAll('.slide')];
    const dots = [...hero.querySelectorAll('.hero-dots button')];
    const DELAY = 6500;
    let current = 0;
    let timer = null;

    // Carga la imagen de cada banner solo si existe
    slides.forEach((slide) => {
      const src = slide.dataset.bg;
      if (!src) return;
      const probe = new Image();
      probe.onload = () => {
        slide.style.setProperty('--slide-img', `url("${src}")`);
        slide.classList.add('has-image');
        updateRibbons();
      };
      probe.src = src;
    });

    const updateRibbons = () =>
      hero.classList.toggle('current-has-image', slides[current].classList.contains('has-image'));

    const goTo = (i) => {
      slides[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected', 'true');
      updateRibbons();
    };

    const start = () => { if (!reduceMotion) { stop(); timer = setInterval(() => goTo(current + 1), DELAY); } };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };

    hero.querySelector('.hero-arrow--next').addEventListener('click', () => { goTo(current + 1); restart(); });
    hero.querySelector('.hero-arrow--prev').addEventListener('click', () => { goTo(current - 1); restart(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); restart(); }));

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);

    hero.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { goTo(current + 1); restart(); }
      if (e.key === 'ArrowLeft')  { goTo(current - 1); restart(); }
    });

    // Deslizar con el dedo en móvil
    let x0 = null;
    hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) goTo(current + (dx < 0 ? 1 : -1));
      x0 = null;
      start();
    });

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  /* ---------- Contadores animados ---------- */
  const fmt = new Intl.NumberFormat('es-CO');
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const duration = 1800;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- Aparición al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const counter = entry.target.querySelector('[data-count]');
      if (counter) animateCount(counter);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- Año automático ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nombre del mes en el calendario ---------- */
  document.querySelectorAll('[data-month]').forEach((el) => {
    el.textContent = new Date().toLocaleDateString('es-CO', { month: 'long' });
  });

  /* ---------- Mini carruseles de productos ("fotos pasando") ---------- */
  document.querySelectorAll('.carousel').forEach((box, boxIndex) => {
    const all = [...box.querySelectorAll('img')];
    let ok = [];
    let idx = 0;
    let timer = null;
    let dotsWrap = null;

    const render = () => {
      ok.forEach((img, i) => img.classList.toggle('is-on', i === idx));
      dotsWrap?.querySelectorAll('span').forEach((d, i) => d.classList.toggle('is-on', i === idx));
    };
    const rebuild = () => {
      ok = all.filter((img) => img.complete && img.naturalWidth > 0);
      box.classList.toggle('no-img', ok.length === 0);
      dotsWrap?.remove();
      dotsWrap = null;
      if (ok.length > 1) {
        dotsWrap = document.createElement('div');
        dotsWrap.className = 'carousel-dots';
        dotsWrap.setAttribute('aria-hidden', 'true');
        ok.forEach(() => dotsWrap.appendChild(document.createElement('span')));
        box.appendChild(dotsWrap);
      }
      idx = Math.min(idx, Math.max(ok.length - 1, 0));
      render();
      clearInterval(timer);
      if (ok.length > 1 && !reduceMotion) {
        // desfase para que no cambien todos al mismo tiempo
        setTimeout(() => {
          clearInterval(timer);
          timer = setInterval(() => { idx = (idx + 1) % ok.length; render(); }, 3200);
        }, boxIndex * 450);
      }
    };

    box.classList.add('no-img');
    all.forEach((img) => {
      if (img.complete) return;
      img.addEventListener('load', rebuild, { once: true });
      img.addEventListener('error', () => img.remove(), { once: true });
    });
    rebuild();
  });

  /* ---------- Visor de fotos y videos (lightbox) ---------- */
  const galleries = document.querySelectorAll('.gallery');
  if (galleries.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visor de galería');
    lb.innerHTML = `
      <div class="lightbox-stage"></div>
      <button class="lightbox-btn lightbox-close" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <button class="lightbox-btn lightbox-prev" aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="lightbox-btn lightbox-next" aria-label="Siguiente"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>`;
    document.body.appendChild(lb);
    const stage = lb.querySelector('.lightbox-stage');
    let photoList = [];
    let photoIdx = 0;
    let lastFocus = null;

    const caption = (text) => `<p class="lightbox-caption">${text || ''}</p>`;
    const youtubeId = (url) => (url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];

    const open = (mode) => {
      lastFocus = document.activeElement;
      lb.dataset.mode = mode;
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lightbox-close').focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      stage.innerHTML = '';
      document.body.style.overflow = '';
      lastFocus?.focus();
    };

    const showPhoto = (i) => {
      photoIdx = (i + photoList.length) % photoList.length;
      const card = photoList[photoIdx];
      const img = card.querySelector('img');
      stage.innerHTML = `<img src="${img.currentSrc || img.src}" alt="${img.alt}">${caption(card.dataset.title)}`;
    };

    const showVideo = (card) => {
      const src = card.dataset.video || '';
      const yt = youtubeId(src);
      if (yt) {
        stage.innerHTML = `<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1&rel=0" title="${card.dataset.title}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>${caption(card.dataset.title)}`;
      } else {
        stage.innerHTML = `<video src="${src}" controls autoplay playsinline></video>${caption(card.dataset.title)}`;
        stage.querySelector('video').addEventListener('error', () => {
          stage.innerHTML = `<p class="lightbox-msg">Este video estará disponible muy pronto. 💜</p>${caption(card.dataset.title)}`;
        });
      }
    };

    galleries.forEach((gallery) => {
      const isVideo = gallery.classList.contains('gallery--videos');
      gallery.querySelectorAll('.media-card').forEach((card) => {
        card.addEventListener('click', () => {
          if (isVideo) { showVideo(card); open('video'); return; }
          if (card.classList.contains('no-img')) return;
          photoList = [...gallery.querySelectorAll('.media-card:not(.no-img)')];
          showPhoto(photoList.indexOf(card));
          open('photo');
        });
      });
    });

    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(photoIdx - 1));
    lb.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(photoIdx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (lb.dataset.mode === 'photo' && e.key === 'ArrowRight') showPhoto(photoIdx + 1);
      if (lb.dataset.mode === 'photo' && e.key === 'ArrowLeft')  showPhoto(photoIdx - 1);
    });
  }
})();
