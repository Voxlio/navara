/* ==========================================================================
   NAVARA OFFSHORE — behaviour
   Progressive enhancement only: every page is fully readable without this.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- Nav --- */

  function initNav() {
    var burger = document.querySelector('.burger');
    var nav = document.getElementById('primary-nav');
    if (!burger || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    // Escape closes the menu and returns focus to the trigger.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    // Clicking outside closes it.
    document.addEventListener('click', function (e) {
      if (burger.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(e.target) && !burger.contains(e.target)) setOpen(false);
    });

    // Reset state when returning to desktop so the menu can't stay stuck open.
    var wide = window.matchMedia('(min-width: 961px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
    else if (wide.addListener) wide.addListener(onChange);
  }

  /* ------------------------------------------------------ Sticky header --- */

  function initMasthead() {
    var masthead = document.querySelector('.masthead');
    if (!masthead) return;

    var ticking = false;
    function update() {
      masthead.classList.toggle('is-stuck', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------- Image fallbacks ---
     Photography is served from Unsplash's CDN. If a request fails (offline,
     blocked, or a retired photo ID) the <img> is removed so the figure's own
     composed navy gradient shows through instead of a broken-image icon.    */

  function initFigures() {
    var imgs = document.querySelectorAll('.figure img, .hero__media img, .pagehead__media img');

    Array.prototype.forEach.call(imgs, function (img) {
      function fail() {
        var holder = img.parentNode;
        if (holder) holder.classList.add('is-empty');
        if (img.parentNode) img.parentNode.removeChild(img);
      }
      img.addEventListener('error', fail, { once: true });
      // Covers images that errored before this script ran.
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  /* ------------------------------------------------------------ Slider ---
     Progressive enhancement, strictly. The markup ships as a stack of
     slides with the first one carrying .is-current; every control below is
     created here, so a browser with scripting off shows one still
     photograph and no dead buttons.

     ARIA follows the APG "carousel with tabbed slide picker": the dots are
     a tablist, the slides are the tabpanels. Auto-rotation is off under
     prefers-reduced-motion (WCAG 2.2.2), pauses on hover and on focus, and
     stops for good the moment someone works the controls themselves.      */

  function initSliders() {
    var sliders = document.querySelectorAll('[data-slider]');
    var stillness = window.matchMedia('(prefers-reduced-motion: reduce)');
    var DELAY = 6500;

    Array.prototype.forEach.call(sliders, function (root, sliderIndex) {
      var track = root.querySelector('.slider__track');
      if (!track) return;

      var slides = Array.prototype.slice.call(track.querySelectorAll('.slider__slide'));
      if (slides.length < 2) return;

      var uid = 'sl' + (sliderIndex + 1);
      var current = Math.max(0, slides.indexOf(root.querySelector('.slider__slide.is-current')));
      var timer = null;
      var rotating = false;

      root.setAttribute('role', 'group');
      root.setAttribute('aria-roledescription', 'carousel');

      /* ---- controls ---- */

      function arrow(dir) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slider__nav slider__nav--' + (dir < 0 ? 'prev' : 'next');
        b.setAttribute('aria-label', dir < 0 ? 'Previous image' : 'Next image');
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'
          + (dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>';
        b.addEventListener('click', function () {
          stop();
          go(current + dir);
        });
        return b;
      }

      var dots = document.createElement('div');
      dots.className = 'slider__dots';
      dots.setAttribute('role', 'tablist');
      dots.setAttribute('aria-label', 'Choose image');

      var tabs = slides.map(function (slide, i) {
        var panelId = uid + '-panel-' + i;
        var tabId = uid + '-tab-' + i;
        var label = (i + 1) + ' of ' + slides.length;

        slide.id = panelId;
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-labelledby', tabId);

        var tab = document.createElement('button');
        tab.type = 'button';
        tab.id = tabId;
        tab.className = 'slider__dot';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panelId);
        tab.setAttribute('aria-label', 'Image ' + label);
        tab.addEventListener('click', function () {
          stop();
          go(i);
        });
        dots.appendChild(tab);
        return tab;
      });

      // Roving tabindex across the picker, per the tablist pattern.
      dots.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        var target = e.key === 'Home' ? 0 : e.key === 'End' ? slides.length - 1 : null;
        if (!step && target === null) return;
        e.preventDefault();
        stop();
        go(target === null ? current + step : target);
        tabs[current].focus();
      });

      root.appendChild(arrow(-1));
      root.appendChild(arrow(1));
      root.appendChild(dots);

      /* ---- state ---- */

      function go(i) {
        current = (i + slides.length) % slides.length;
        slides.forEach(function (slide, n) {
          var on = n === current;
          slide.classList.toggle('is-current', on);
          tabs[n].setAttribute('aria-selected', String(on));
          tabs[n].tabIndex = on ? 0 : -1;
        });
      }

      function tick() { go(current + 1); }

      function start() {
        if (rotating || stillness.matches || document.hidden) return;
        rotating = true;
        track.setAttribute('aria-live', 'off');
        timer = window.setInterval(tick, DELAY);
      }

      function pause() {
        if (!rotating) return;
        rotating = false;
        window.clearInterval(timer);
        track.setAttribute('aria-live', 'polite');
      }

      // A deliberate control press ends rotation permanently; a hover does not.
      var halted = false;
      function stop() { halted = true; pause(); }
      function resume() { if (!halted) start(); }

      go(current);
      track.setAttribute('aria-live', 'polite');

      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', resume);
      root.addEventListener('focusin', pause);
      root.addEventListener('focusout', function (e) {
        if (!root.contains(e.relatedTarget)) resume();
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) pause(); else resume();
      });

      /* ---- swipe (touch and pen only, so mouse selection still works) ---- */

      var startX = null;
      root.addEventListener('pointerdown', function (e) {
        startX = e.pointerType === 'mouse' ? null : e.clientX;
      });
      root.addEventListener('pointerup', function (e) {
        if (startX === null) return;
        var dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) < 40) return;
        stop();
        go(current + (dx < 0 ? 1 : -1));
      });

      start();
    });
  }

  /* --------------------------------------------------------------- Form ---
     There is no mail backend on a static host, so the form hands off to the
     enquiries mailbox with the answers pre-filled, and says so plainly.     */

  function initForm() {
    var form = document.getElementById('enquiry-form');
    if (!form) return;

    var panel = form.closest('.form-panel') || form;
    var status = document.getElementById('form-status');

    function show(message, isError) {
      if (!status) return;
      status.textContent = message;
      status.className = 'form-status' + (isError ? ' form-status--error' : '');
      status.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      panel.classList.add('was-submitted');

      if (!form.checkValidity()) {
        show('Some required details are missing. Check the highlighted fields and send again.', true);
        var firstBad = form.querySelector(':invalid');
        if (firstBad) firstBad.focus();
        return;
      }

      var get = function (n) {
        var el = form.elements[n];
        return el && el.value ? el.value.trim() : '';
      };

      var subject = 'Enquiry — ' + (get('service') || 'General') + ' — ' + get('name');
      var body = [
        'Name: ' + get('name'),
        'Company: ' + (get('company') || '—'),
        'Email: ' + get('email'),
        'Phone: ' + (get('phone') || '—'),
        'Service required: ' + (get('service') || '—'),
        '',
        'Requirement:',
        get('message')
      ].join('\n');

      window.location.href = 'mailto:enquiries@navaraoffshore.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      show('Your email app is opening with these details filled in. Send that message and Navara will reply to ' + get('email') + '. If nothing opened, email enquiries@navaraoffshore.com directly.', false);
    });
  }

  /* --------------------------------------------------------------- Year --- */

  function initYear() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ----------------------------------------------------------- Language --- */

  /* The switcher itself works with no script — it is a <details>. This only
     adds the two behaviours a native <details> lacks: closing when you click
     away from it, and closing on Escape. */
  function initLangMenu() {
    var box = document.querySelector('.lang');
    if (!box) return;

    document.addEventListener('click', function (e) {
      if (box.open && !box.contains(e.target)) box.open = false;
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !box.open) return;
      box.open = false;
      var btn = box.querySelector('.lang__btn');
      if (btn) btn.focus();
    });
  }

  /* Detect-and-offer. Deliberately NOT a redirect: Googlebot crawls from the
     US without an Accept-Language header, so auto-redirecting would leave the
     English pages unindexed, and plenty of readers in Lagos or Abidjan run an
     en-US browser and want the original. So we surface a one-line offer the
     reader can take or dismiss, and the dismissal sticks. */
  var LANGS = {
    fr: { name: 'Français', msg: 'Ce site est en anglais. Voulez-vous une traduction automatique en français ?', cta: 'Traduire' },
    pt: { name: 'Português', msg: 'Este site está em inglês. Deseja uma tradução automática para português?', cta: 'Traduzir' },
    es: { name: 'Español',  msg: 'Este sitio está en inglés. ¿Quiere una traducción automática al español?', cta: 'Traducir' }
  };

  function preferredLang() {
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];

    for (var i = 0; i < list.length; i++) {
      var base = String(list[i]).toLowerCase().split('-')[0];
      if (base === 'en') return null;   // English ranks first — no offer.
      if (LANGS[base]) return base;
    }
    return null;
  }

  /* localStorage can be unavailable (private mode, blocked cookies), and a
     throwing setItem must not take the rest of boot() down with it. */
  function remembered(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (err) { /* no persistence available; the bar just reappears */ }
    return null;
  }

  function initLangOffer() {
    var bar = document.getElementById('langbar');
    if (!bar) return;

    if (remembered('navara.langbar') === 'dismissed') return;

    var code = preferredLang();
    if (!code) return;

    /* The English link in the menu is this page's own path, which is exactly
       what the translate.goog URL for the same page needs to be built from. */
    var here = document.querySelector('.lang__opt.is-current');
    var path = here ? here.getAttribute('href') : '/';

    var msg = document.getElementById('langbar-msg');
    var go = document.getElementById('langbar-go');
    var close = document.getElementById('langbar-close');
    if (!msg || !go || !close) return;

    msg.textContent = LANGS[code].msg;
    go.textContent = LANGS[code].cta;
    go.setAttribute('hreflang', code);
    go.setAttribute('lang', code);
    go.href = 'https://navaraoffshore-com.translate.goog' + path
      + '?_x_tr_sl=en&_x_tr_tl=' + code + '&_x_tr_hl=' + code;

    bar.setAttribute('lang', code);
    bar.hidden = false;

    close.addEventListener('click', function () {
      bar.hidden = true;
      remembered('navara.langbar', 'dismissed');
    });
  }

  function boot() {
    initNav();
    initMasthead();
    initFigures();
    initSliders();
    initLangMenu();
    initLangOffer();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
