/* ==========================================================================
   CADENZA Atelier — Єдиний модуль валідації форм та збереження заявок (validation.js)
   Обробляє:
   1. #feedbackForm — розширена форма зворотного зв'язку з модалкою #successModal
   2. #form — форма запису на приватну консультацію (#booking на index.html)
   3. #mForm — модальна форма запису на сесію / обговорення збірки (Platforms & Configurator)
   ========================================================================== */
(function (window, document) {
  'use strict';

  /* ---------- 1. Спільні регулярні вирази та правила ---------- */
  var PATTERNS = {
    name: /^[а-яА-ЯіІїЇєЄґҐa-zA-Z'’-\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    phoneStrict: /^\+380\d{9}$/,
    phoneLocalHint: /^0\d{9}$/,
    phoneFlexible: /^\+?[0-9\s\-()]{10,18}$/
  };

  var MESSAGES = {
    username: "Введіть ім'я (щонайменше 2 літери).",
    email: 'Введіть коректну електронну адресу.',
    phoneStrict: 'Формат: +380XXXXXXXXX (без пробілів, дужок і дефісів).',
    phoneFlexible: 'Вкажіть номер у форматі +380... (від 10 цифр).',
    message: 'Повідомлення має містити щонайменше 10 символів.',
    agreement: 'Потрібна згода з політикою конфіденційності.'
  };

  var Validator = {
    patterns: PATTERNS,
    isNameValid: function (val) {
      return PATTERNS.name.test(String(val || '').trim());
    },
    isEmailValid: function (val) {
      return PATTERNS.email.test(String(val || '').trim());
    },
    isPhoneStrictValid: function (val) {
      return PATTERNS.phoneStrict.test(String(val || '').trim());
    },
    isPhoneFlexibleValid: function (val, required) {
      var trimmed = String(val || '').trim();
      if (!trimmed) return !required;
      return PATTERNS.phoneFlexible.test(trimmed);
    },
    validateModalInput: function (input) {
      if (!input) return true;
      var val = input.value.trim();
      var name = input.name;
      var isValid = true;

      if (input.required && !val) {
        isValid = false;
      } else if (name === 'name' && val) {
        isValid = this.isNameValid(val);
      } else if (name === 'email' && val) {
        isValid = this.isEmailValid(val);
      } else if (name === 'phone' && val) {
        isValid = this.isPhoneFlexibleValid(val, false);
      }

      input.classList.toggle('input-invalid', !isValid);
      input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
      return isValid;
    }
  };

  if (window.CadenzaApp) {
    window.CadenzaApp.Validator = Validator;
  }

  /* ==========================================================================
     2. Валідація форми зворотного зв'язку (#feedbackForm на index.html)
     ========================================================================== */
  function initFeedbackForm() {
    var form = document.getElementById('feedbackForm');
    if (!form) return;

    var STATE_CLASSES = {
      normal: 'border-cf-line',
      error: 'border-red-500',
      success: 'border-green-500'
    };

    var submitBtn = form.querySelector('button[type="submit"]');
    var phoneHint = document.getElementById('phoneHint');
    var modal = document.getElementById('successModal');
    var dialogCard = modal ? modal.querySelector('[role="dialog"]') : null;
    var closeBtn = document.getElementById('successClose');

    var fields = {
      username: document.getElementById('username'),
      email: document.getElementById('email'),
      phone: document.getElementById('phone'),
      topic: document.getElementById('topic'),
      message: document.getElementById('message'),
      agreement: document.getElementById('agreement')
    };

    var touched = {};
    var isSubmitting = false;
    var lastFocus = null;

    var RULES = {
      username: {
        check: function () { return Validator.isNameValid(fields.username.value); },
        message: MESSAGES.username
      },
      email: {
        check: function () { return Validator.isEmailValid(fields.email.value); },
        message: MESSAGES.email
      },
      phone: {
        check: function () { return Validator.isPhoneStrictValid(fields.phone.value); },
        message: MESSAGES.phoneStrict
      },
      message: {
        check: function () { return fields.message.value.trim().length >= 10; },
        message: MESSAGES.message
      },
      agreement: {
        check: function () { return fields.agreement.checked; },
        message: MESSAGES.agreement
      }
    };

    function getErrorEl(input) {
      return document.getElementById(input.id + 'Error');
    }

    function setState(input, state) {
      Object.keys(STATE_CLASSES).forEach(function (k) {
        input.classList.remove(STATE_CLASSES[k]);
      });
      input.classList.add(STATE_CLASSES[state]);
      input.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
    }

    function hideError(input) {
      var p = getErrorEl(input);
      if (p) {
        p.textContent = '';
        p.hidden = true;
      }
    }

    function showError(input, text) {
      setState(input, 'error');
      var p = getErrorEl(input);
      if (p) {
        p.textContent = text;
        p.hidden = false;
      }
    }

    function showSuccess(input) {
      setState(input, 'success');
      hideError(input);
    }

    function clearError(input) {
      if (!input) return;
      setState(input, 'normal');
      hideError(input);
    }

    function validateField(key) {
      var input = fields[key];
      var ok = RULES[key].check();
      if (ok) showSuccess(input);
      else showError(input, RULES[key].message);
      return ok;
    }

    function updatePhoneHint() {
      if (!phoneHint || !fields.phone) return;
      var v = fields.phone.value.trim();
      if (PATTERNS.phoneLocalHint.test(v)) {
        phoneHint.textContent = 'Можливо, ви маєте на увазі формат: +380' + v.slice(1);
        phoneHint.hidden = false;
      } else {
        phoneHint.textContent = '';
        phoneHint.hidden = true;
      }
    }

    Object.keys(RULES).forEach(function (key) {
      var input = fields[key];
      if (!input) return;

      if (key === 'agreement') {
        input.addEventListener('change', function () {
          touched[key] = true;
          validateField(key);
        });
        return;
      }

      input.addEventListener('input', function () {
        if (touched[key]) validateField(key);
        if (key === 'phone') updatePhoneHint();
      });

      input.addEventListener('blur', function () {
        touched[key] = true;
        validateField(key);
      });
    });

    function resetFieldStates() {
      touched = {};
      Object.keys(RULES).forEach(function (key) {
        clearError(fields[key]);
      });
      updatePhoneHint();
    }

    function isModalOpen() {
      return !!modal && !modal.classList.contains('hidden');
    }

    function openModal() {
      if (!modal || !dialogCard) return;
      lastFocus = submitBtn;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      dialogCard.classList.remove('scale-95');
      dialogCard.classList.add('scale-100');
      document.body.classList.add('overflow-hidden');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      if (!isModalOpen()) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      dialogCard.classList.add('scale-95');
      dialogCard.classList.remove('scale-100');
      document.body.classList.remove('overflow-hidden');
      isSubmitting = false;
      submitBtn.disabled = false;
      if (lastFocus) lastFocus.focus();
    }

    function trapFocus(e) {
      if (!dialogCard) return;
      var focusables = dialogCard.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (!dialogCard.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!isModalOpen()) return;
      if (e.key === 'Escape' || e.key === 'Esc') closeModal();
      else if (e.key === 'Tab') trapFocus(e);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;
      submitBtn.disabled = true;

      var firstInvalid = null;
      Object.keys(RULES).forEach(function (key) {
        touched[key] = true;
        if (!validateField(key) && !firstInvalid) {
          firstInvalid = fields[key];
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        isSubmitting = false;
        submitBtn.disabled = false;
        return;
      }

      if (window.CadenzaApp && window.CadenzaApp.Storage) {
        window.CadenzaApp.Storage.saveLead({
          type: 'feedback',
          name: fields.username.value.trim(),
          email: fields.email.value.trim(),
          phone: fields.phone.value.trim(),
          topic: fields.topic ? fields.topic.value : '',
          message: fields.message.value.trim()
        });
      }

      openModal();
      form.reset();
      resetFieldStates();
    });
  }

  /* ==========================================================================
     3. Валідація форми запису на приватну консультацію (#form на index.html)
     (Виправлено баг подвійного обробника submit та зламаних селекторів placeholder)
     ========================================================================== */
  function initBookingForm() {
    var bookingForm = document.getElementById('form');
    if (!bookingForm) return;

    var nameInput = bookingForm.querySelector('input[name="name"]');
    var emailInput = bookingForm.querySelector('input[name="email"]');
    var phoneInput = bookingForm.querySelector('input[name="phone"]');
    var radios = bookingForm.querySelectorAll('.radio');
    var selectedFormat = 'Студія';

    radios.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedFormat = btn.dataset.v || btn.textContent.trim();
        radios.forEach(function (r) {
          r.setAttribute('aria-checked', r === btn ? 'true' : 'false');
        });
      });
    });

    [nameInput, emailInput, phoneInput].forEach(function (inp) {
      if (!inp) return;
      inp.addEventListener('input', function () {
        if (inp.classList.contains('input-invalid')) {
          Validator.validateModalInput(inp);
        }
      });
      inp.addEventListener('blur', function () {
        if (inp.value.trim()) Validator.validateModalInput(inp);
      });
    });

    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var validName = Validator.validateModalInput(nameInput);
      var validEmail = Validator.validateModalInput(emailInput);
      var validPhone = Validator.validateModalInput(phoneInput);

      if (!validName || !validEmail || !validPhone) {
        if (window.CadenzaApp) {
          window.CadenzaApp.toast('Будь ласка, перевірте коректність заповнення полів.');
        }
        var firstBad = [nameInput, emailInput, phoneInput].find(function (i) {
          return i && i.classList.contains('input-invalid');
        });
        if (firstBad) firstBad.focus();
        return;
      }

      var savedCfg = (window.CadenzaApp && window.CadenzaApp.Storage) ? window.CadenzaApp.Storage.getConfig() : {};
      var userName = nameInput.value.trim();

      if (window.CadenzaApp && window.CadenzaApp.Storage) {
        window.CadenzaApp.Storage.saveLead({
          type: 'booking',
          name: userName,
          email: emailInput.value.trim(),
          phone: phoneInput ? phoneInput.value.trim() : '',
          format: selectedFormat,
          platform: savedCfg.platform || 'road',
          finish: savedCfg.finish || 'raw'
        });
      }

      bookingForm.reset();
      [nameInput, emailInput, phoneInput].forEach(function (inp) {
        if (inp) {
          inp.classList.remove('input-invalid');
          inp.setAttribute('aria-invalid', 'false');
        }
      });
      radios.forEach(function (r, idx) {
        r.setAttribute('aria-checked', idx === 0 ? 'true' : 'false');
      });
      selectedFormat = 'Студія';

      if (window.CadenzaApp) {
        window.CadenzaApp.toast('Дякуємо, ' + userName + '! Сесію (' + selectedFormat + ') зарезервовано.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFeedbackForm();
    initBookingForm();
  });
})(window, document);
