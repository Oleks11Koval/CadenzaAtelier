/* ==========================================================================
   CADENZA Atelier — Ядро клієнтської архітектури (theme.js)
   Модулі: ThemeController, StorageManager, Toast, MobileNav, ScrollReveal,
           Каталог платформ (Single Source of Truth для всіх сторінок)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var THEME_KEY = 'cadenza_theme';
  var CONFIG_KEY = 'cadenza_config_state';
  var LEADS_KEY = 'cadenza_leads';
  var root = document.documentElement;

  /* ---------- 1. Спільний каталог платформ і фінішів (Single Source of Truth) ---------- */
  var PLATFORMS = {
    road: {
      id: 'road',
      code: 'CA-001',
      name: 'Road Stradale',
      sub: 'Асфальт · швидкість · дистанція',
      basePrice: 6000,
      framePrice: 3800,
      weight: '1 150 г',
      clearance: 32,
      baseStack: 565,
      baseReach: 385,
      baseWb: 995,
      haEndurance: '72.5',
      haPerformance: '73.0',
      defaultTrans: 'elec'
    },
    gravel: {
      id: 'gravel',
      code: 'CA-002',
      name: 'Gravel Sterrato',
      sub: 'Гравій · бездоріжжя · пригоди',
      basePrice: 6400,
      framePrice: 4100,
      weight: '1 380 г',
      clearance: 50,
      baseStack: 595,
      baseReach: 386,
      baseWb: 1025,
      haEndurance: '71.0',
      haPerformance: '71.5',
      defaultTrans: 'elec'
    },
    track: {
      id: 'track',
      code: 'CA-003',
      name: 'Track Velodromo',
      sub: 'Трек · мінімалізм · чистота лінії',
      basePrice: 5400,
      framePrice: 3400,
      weight: '1 290 г',
      clearance: 28,
      baseStack: 552,
      baseReach: 397,
      baseWb: 978,
      haEndurance: '74.0',
      haPerformance: '74.5',
      defaultTrans: 'track'
    }
  };

  var FINISHES = {
    raw: { id: 'raw', name: 'Raw titanium', stroke: '#A3B4A9', bg: 'transparent', opacity: 0, filter: 'none' },
    stealth: { id: 'stealth', name: 'Stealth black', stroke: '#5C6B62', bg: '#0b0f0d', opacity: 0.55, filter: 'grayscale(.5) contrast(1.1)' },
    forest: { id: 'forest', name: 'Deep forest', stroke: '#4A7C59', bg: '#1A3020', opacity: 0.6, filter: 'saturate(.9)' }
  };

  /* ---------- 2. Безпечна робота з Web Storage ---------- */
  var Storage = {
    getRaw: function (key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setRaw: function (key, val) {
      try { localStorage.setItem(key, val); } catch (e) {}
    },
    getJSON: function (key, fallback) {
      var raw = this.getRaw(key);
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch (e) { return fallback; }
    },
    setJSON: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    },
    getConfig: function () {
      return this.getJSON(CONFIG_KEY, {}) || {};
    },
    saveConfig: function (patch) {
      var current = this.getConfig();
      var next = Object.assign({}, current, patch, { updatedAt: new Date().toISOString() });
      this.setJSON(CONFIG_KEY, next);
      return next;
    },
    saveLead: function (leadData) {
      var leads = this.getJSON(LEADS_KEY, []);
      if (!Array.isArray(leads)) leads = [];
      var entry = Object.assign({
        id: 'lead_' + Date.now(),
        createdAt: new Date().toISOString(),
        page: window.location.pathname.split('/').pop() || 'index.html'
      }, leadData);
      leads.push(entry);
      this.setJSON(LEADS_KEY, leads);
      return entry;
    }
  };

  /* ---------- 3. Миттєве застосування теми у <head> (без FOUC) ---------- */
  if (Storage.getRaw(THEME_KEY) === 'light') {
    root.setAttribute('data-theme', 'light');
  }

  /* ---------- 4. Глобальний сервіс Toast-повідомлень ---------- */
  var toastTimer = null;
  function showToast(message, duration) {
    var t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast' + (document.querySelector('.dock') ? ' above-dock' : '');
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('show');
    }, duration || 2800);
  }

  /* ---------- 5. Ініціалізація перемикача теми ---------- */
  var SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function initThemeToggle() {
    if (document.querySelector('.theme-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle' + (document.querySelector('.dock') ? ' above-dock' : '');
    document.body.appendChild(btn);

    function render() {
      var isLight = root.getAttribute('data-theme') === 'light';
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      btn.setAttribute('aria-label', isLight ? 'Увімкнути темну тему' : 'Увімкнути світлу тему');
      btn.innerHTML = (isLight ? MOON_ICON : SUN_ICON) + '<span>' + (isLight ? 'Темна тема' : 'Світла тема') + '</span>';
    }

    btn.addEventListener('click', function () {
      var isLight = root.getAttribute('data-theme') === 'light';
      root.classList.add('theme-anim');
      if (isLight) {
        root.removeAttribute('data-theme');
        Storage.setRaw(THEME_KEY, 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
        Storage.setRaw(THEME_KEY, 'light');
      }
      render();
      setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    });

    render();
  }

  /* ---------- 6. Мобільна навігація (Бургер-меню з підтримкою A11y) ---------- */
  var BURGER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function initNavigation() {
    var hdrWrap = document.querySelector('.hdr > .wrap, .hdr > .wrap-wide');
    var nav = document.querySelector('.hdr .nav');
    if (!hdrWrap || !nav) return;

    if (!nav.id) nav.id = 'mainNav';

    // Якщо немає кнопки бургер-меню — створюємо її автоматично
    var toggleBtn = hdrWrap.querySelector('.nav-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'nav-toggle';
      toggleBtn.setAttribute('aria-controls', nav.id);
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Відкрити меню навігації');
      toggleBtn.innerHTML = BURGER_ICON;

      var pillBtn = hdrWrap.querySelector('.pill');
      if (pillBtn) {
        var actionsWrap = document.createElement('div');
        actionsWrap.className = 'hdr-actions';
        hdrWrap.insertBefore(actionsWrap, pillBtn);
        actionsWrap.appendChild(pillBtn);
        actionsWrap.appendChild(toggleBtn);
      } else {
        hdrWrap.appendChild(toggleBtn);
      }
    }

    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', open ? 'Закрити меню навігації' : 'Відкрити меню навігації');
      toggleBtn.innerHTML = open ? CLOSE_ICON : BURGER_ICON;
    }

    toggleBtn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });

    // Закриваємо мобільне меню при кліку на посилання або поза межами шапки
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !e.target.closest('.hdr')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        setOpen(false);
        toggleBtn.focus();
      }
    });
  }

  /* ---------- 7. Глобальна анімація появи секцій (.rv) ---------- */
  function initScrollReveal() {
    var elements = document.querySelectorAll('.rv');
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 8. Експорт у глобальний простір імен CadenzaApp ---------- */
  window.CadenzaApp = {
    PLATFORMS: PLATFORMS,
    FINISHES: FINISHES,
    Storage: Storage,
    toast: showToast,
    formatNumber: function (n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initNavigation();
    initScrollReveal();
  });
})(window, document);
