/* CADENZA Atelier — перемикач теми (темна за замовчуванням, вибір запам'ятовується) */
(function () {
  var KEY = 'cadenza_theme';
  var root = document.documentElement;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // застосовуємо тему одразу, щоб не було «спалаху»
  if (read() === 'light') root.setAttribute('data-theme', 'light');

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle' + (document.querySelector('.dock') ? ' above-dock' : '');
    document.body.appendChild(btn);

    function render() {
      var light = root.getAttribute('data-theme') === 'light';
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.setAttribute('aria-label', light ? 'Увімкнути темну тему' : 'Увімкнути світлу тему');
      btn.innerHTML = (light ? MOON : SUN) + '<span>' + (light ? 'Темна тема' : 'Світла тема') + '</span>';
    }

    btn.addEventListener('click', function () {
      var light = root.getAttribute('data-theme') === 'light';
      root.classList.add('theme-anim');
      if (light) { root.removeAttribute('data-theme'); write('dark'); }
      else { root.setAttribute('data-theme', 'light'); write('light'); }
      render();
      setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    });

    render();
  });
})();
