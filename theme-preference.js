(function (window, document) {
  'use strict';

  var key = 'cadenza_theme';
  var system = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
  var choice = null;
  try { choice = window.localStorage.getItem(key); } catch (e) {}

  function apply() {
    var light = choice === 'light' || (choice !== 'dark' && system && system.matches);
    var root = document.documentElement;
    if (light) root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    root.style.colorScheme = light ? 'light' : 'dark';
    var color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = light ? '#D8C6A8' : '#0E1511';
    document.dispatchEvent(new Event('cadenza-theme-change'));
  }

  window.CadenzaTheme = {
    select: function (value) {
      choice = value;
      try { window.localStorage.setItem(key, value); } catch (e) {}
      apply();
    }
  };

  if (system) {
    if (system.addEventListener) system.addEventListener('change', apply);
    else if (system.addListener) system.addListener(apply);
  }
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) {
      choice = event.newValue;
      apply();
    }
  });
  apply();
})(window, document);
