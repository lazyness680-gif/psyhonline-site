/* Ольга Косых — landing interactions */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Header, progress, mobile bar ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const mobileBar = $('#mobileBar');
  let scrollQueued = false;

  const updateScrollUI = () => {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 14);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      progress.style.width = value + '%';
    }
    scrollQueued = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  /* Hide the fixed mobile CTA while the booking form is on screen */
  const booking = $('#booking');
  if (booking && mobileBar && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      mobileBar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.12 }).observe(booking);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Active navigation ---------- */
  const navLinks = $$('.nav__link');
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute('href');
      return id && id.startsWith('#') ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (navSections.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-38% 0px -54% 0px', threshold: 0 });
    navSections.forEach((section) => navObserver.observe(section));
  }

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger');
  const mobileMenu = $('#mobileMenu');

  const setMenu = (open) => {
    if (!burger || !mobileMenu) return;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    mobileMenu.inert = !open;
    document.body.classList.toggle('menu-open', open);
  };

  if (burger && mobileMenu) {
    mobileMenu.inert = true;
    burger.addEventListener('click', () => setMenu(!burger.classList.contains('is-open')));
    $$('a', mobileMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && burger.classList.contains('is-open')) {
        setMenu(false);
        burger.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) setMenu(false);
    });
  }

  /* ---------- Deadline date ---------- */
  const deadlineEls = $$('[data-deadline]');
  if (deadlineEls.length) {
    const today = new Date();
    const daysToSunday = (7 - today.getDay()) % 7;
    const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToSunday);
    const label = daysToSunday === 0
      ? 'до конца воскресенья'
      : 'до воскресенья, ' + sunday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    deadlineEls.forEach((el) => { el.textContent = label; });
  }

  /* ---------- FAQ accordion ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach((item) => {
    const button = $('.faq-q', item);
    const panel = $('.faq-a', item);
    if (!button || !panel) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      faqItems.forEach((other) => {
        if (other === item) return;
        other.classList.remove('is-open');
        const otherButton = $('.faq-q', other);
        const otherPanel = $('.faq-a', other);
        if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
        if (otherPanel) otherPanel.setAttribute('aria-hidden', 'true');
      });
      item.classList.toggle('is-open', !isOpen);
      button.setAttribute('aria-expanded', String(!isOpen));
      panel.setAttribute('aria-hidden', String(isOpen));
    });
  });

  /* ---------- Documents lightbox ---------- */
  const docButtons = $$('[data-doc]');
  const gallery = $('#galleryDialog');
  const galleryImage = $('#galleryImage');
  const galleryTitle = $('#galleryTitle');
  const galleryCaption = $('#galleryCaption');
  const galleryCounter = $('#galleryCounter');
  let galleryIndex = 0;

  const renderDoc = (index) => {
    if (!docButtons.length) return;
    galleryIndex = (index + docButtons.length) % docButtons.length;
    const button = docButtons[galleryIndex];
    if (galleryImage) {
      galleryImage.src = button.dataset.doc || '';
      galleryImage.alt = button.dataset.title || 'Документ об образовании';
    }
    if (galleryTitle) galleryTitle.textContent = button.dataset.title || 'Документ об образовании';
    if (galleryCaption) galleryCaption.textContent = button.dataset.caption || '';
    if (galleryCounter) galleryCounter.textContent = (galleryIndex + 1) + ' / ' + docButtons.length;
  };

  const openGallery = (index = 0) => {
    if (!gallery) return;
    renderDoc(index);
    if (typeof gallery.showModal === 'function') gallery.showModal();
    else gallery.setAttribute('open', '');
    document.body.classList.add('no-scroll');
  };

  const closeGallery = () => {
    if (!gallery) return;
    if (typeof gallery.close === 'function') gallery.close();
    else gallery.removeAttribute('open');
    document.body.classList.remove('no-scroll');
  };

  docButtons.forEach((button, index) => {
    button.addEventListener('click', () => openGallery(index));
  });
  $$('[data-open-gallery]').forEach((button) => {
    button.addEventListener('click', () => openGallery(0));
  });

  if (gallery) {
    const closeBtn = $('[data-close-gallery]', gallery);
    const prevBtn = $('[data-gallery-prev]', gallery);
    const nextBtn = $('[data-gallery-next]', gallery);
    if (closeBtn) closeBtn.addEventListener('click', closeGallery);
    if (prevBtn) prevBtn.addEventListener('click', () => renderDoc(galleryIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => renderDoc(galleryIndex + 1));
    gallery.addEventListener('click', (event) => {
      if (event.target === gallery) closeGallery();
    });
    gallery.addEventListener('close', () => document.body.classList.remove('no-scroll'));
    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') renderDoc(galleryIndex - 1);
      if (event.key === 'ArrowRight') renderDoc(galleryIndex + 1);
    });

    let touchStartX = 0;
    gallery.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    gallery.addEventListener('touchend', (event) => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 45) renderDoc(galleryIndex + (delta < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- Privacy dialog ---------- */
  const privacy = $('#privacyDialog');
  const openPrivacy = () => {
    if (!privacy) return;
    if (typeof privacy.showModal === 'function') privacy.showModal();
    else privacy.setAttribute('open', '');
    document.body.classList.add('no-scroll');
  };
  const closePrivacy = () => {
    if (!privacy) return;
    if (typeof privacy.close === 'function') privacy.close();
    else privacy.removeAttribute('open');
    document.body.classList.remove('no-scroll');
  };
  $$('[data-open-privacy]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openPrivacy();
    });
  });
  if (privacy) {
    const closeBtn = $('[data-close-privacy]', privacy);
    if (closeBtn) closeBtn.addEventListener('click', closePrivacy);
    privacy.addEventListener('click', (event) => {
      if (event.target === privacy) closePrivacy();
    });
    privacy.addEventListener('close', () => document.body.classList.remove('no-scroll'));
  }

  /* ---------- Booking dialog (Yandex Form) ---------- */
  const bookingDialog = $('#bookingDialog');
  const openBooking = () => {
    if (!bookingDialog) return;
    if (typeof bookingDialog.showModal === 'function') bookingDialog.showModal();
    else bookingDialog.setAttribute('open', '');
    const frame = $('iframe', bookingDialog);
    if (frame && !frame.dataset.loaded) {
      /* Перезагружаем форму уже в видимом окне, чтобы Яндекс корректно рассчитал высоту. */
      frame.src = frame.src;
      frame.dataset.loaded = 'true';
    }
    document.body.classList.add('no-scroll');
  };
  const closeBooking = () => {
    if (!bookingDialog) return;
    if (typeof bookingDialog.close === 'function') bookingDialog.close();
    else bookingDialog.removeAttribute('open');
    document.body.classList.remove('no-scroll');
  };
  $$('[data-open-booking]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!bookingDialog) return;
      event.preventDefault();
      openBooking();
    });
  });
  if (bookingDialog) {
    const closeBtn = $('[data-close-booking]', bookingDialog);
    if (closeBtn) closeBtn.addEventListener('click', closeBooking);
    bookingDialog.addEventListener('click', (event) => {
      if (event.target === bookingDialog) closeBooking();
    });
    bookingDialog.addEventListener('close', () => document.body.classList.remove('no-scroll'));
  }

  /* ---------- Parallax and cursor spotlight ---------- */
  const parallaxEls = $$('[data-parallax]');
  if (!reduceMotion && parallaxEls.length && window.innerWidth >= 900) {
    let parallaxQueued = false;
    const updateParallax = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.setProperty('--py', offset.toFixed(2) + 'px');
      });
      parallaxQueued = false;
    };
    window.addEventListener('scroll', () => {
      if (!parallaxQueued) {
        parallaxQueued = true;
        window.requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
    updateParallax();
  }

  const spotlight = $('[data-spotlight]');
  if (spotlight && finePointer && !reduceMotion) {
    let spotQueued = false;
    let pointerX = 0;
    let pointerY = 0;
    spotlight.addEventListener('pointermove', (event) => {
      const rect = spotlight.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!spotQueued) {
        spotQueued = true;
        window.requestAnimationFrame(() => {
          spotlight.style.setProperty('--spot-x', pointerX + 'px');
          spotlight.style.setProperty('--spot-y', pointerY + 'px');
          spotQueued = false;
        });
      }
    }, { passive: true });
    spotlight.addEventListener('pointerleave', () => {
      spotlight.style.setProperty('--spot-x', '76%');
      spotlight.style.setProperty('--spot-y', '18%');
    }, { passive: true });
  }

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
