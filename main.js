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

  function boot() {
    initNav();
    initMasthead();
    initFigures();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
