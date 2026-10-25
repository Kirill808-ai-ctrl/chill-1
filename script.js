/* ==========================================================
   Chill — массажный салон · скрипты
   Лёгкий вариант: меню, появление блоков, FAQ, форма заявки
   ========================================================== */

/* ---------- НАСТРОЙКИ КЛИЕНТА (меняются здесь) ---------- */
const CONFIG = {
  /* WhatsApp салона: только цифры, с кодом страны, без «+» и пробелов */
  whatsapp: '996555000000',
  /* Название в тексте заявки */
  brand: 'Chill',
};

(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('header');

  /* ---------- Плавный переход к разделу ---------- */
  function goTo(hash) {
    if (hash === '#top' || hash === '#') { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
    const el = document.querySelector(hash);
    if (!el) return;
    let y = 0, n = el;
    while (n) { y += n.offsetTop; n = n.offsetParent; }
    y -= header.offsetHeight - 2;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- Меню (простая панель) ---------- */
  const burger = document.querySelector('.burger');
  const overlay = document.querySelector('.menu-overlay');
  let open = false;

  function setMenu(state) {
    open = state;
    root.classList.toggle('menu-open', state);
    burger.setAttribute('aria-expanded', String(state));
    burger.setAttribute('aria-label', state ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', () => setMenu(!open));
  overlay.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { setMenu(false); burger.focus(); } });
  addEventListener('resize', () => { if (open && innerWidth > 980) setMenu(false); });

  /* внутренние ссылки: закрыть меню и плавно прокрутить */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const hash = a.getAttribute('href');
      if (hash.length < 2 && hash !== '#') return;
      e.preventDefault();
      setMenu(false);
      goTo(hash);
    });
  });

  /* тень у шапки после прокрутки */
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { header.classList.toggle('scrolled', scrollY > 20); ticking = false; });
  }, { passive: true });

  /* ---------- FAQ: плавное раскрытие ответов ---------- */
  const faq = [...document.querySelectorAll('#faq details')];
  const ease = 'cubic-bezier(.16,.8,.24,1)';
  function closeItem(d) {
    if (!d.open || d.dataset.busy) return;
    const body = d.querySelector('p');
    d.dataset.busy = 1;
    d.classList.remove('is-open');
    const a = body.animate(
      [{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: reduce ? 0 : 260, easing: ease });
    body.style.overflow = 'hidden';
    a.onfinish = () => { d.open = false; body.style.overflow = ''; delete d.dataset.busy; };
  }
  function openItem(d) {
    if (d.dataset.busy) return;
    faq.forEach(o => o !== d && closeItem(o));
    d.open = true;
    d.classList.add('is-open');
    const body = d.querySelector('p');
    body.style.overflow = 'hidden';
    const a = body.animate(
      [{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }],
      { duration: reduce ? 0 : 320, easing: ease });
    a.onfinish = () => { body.style.overflow = ''; };
  }
  faq.forEach(d => d.querySelector('summary').addEventListener('click', e => {
    e.preventDefault();
    d.classList.contains('is-open') ? closeItem(d) : openItem(d);
  }));

  /* ---------- Форма заявки → WhatsApp ---------- */
  const form = document.getElementById('lead-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const dateInput = form.elements.date;
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().slice(0, 10);

    const setStatus = (html, err) => { status.innerHTML = html; status.classList.toggle('err', !!err); };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const phone = form.elements.phone.value.trim();
      const digits = phone.replace(/\D/g, '');
      if (name.length < 2) { setStatus('Укажите, пожалуйста, ваше имя.', true); form.elements.name.focus(); return; }
      if (digits.length < 9 || digits.length > 15) { setStatus('Проверьте номер телефона — он должен содержать от 9 цифр.', true); form.elements.phone.focus(); return; }

      let date = '';
      if (dateInput.value) {
        const [y, m, d] = dateInput.value.split('-');
        date = `${d}.${m}.${y}`;
      }
      const msg = form.elements.msg.value.trim();
      const lines = [
        `Здравствуйте! Хочу записаться в ${CONFIG.brand}.`,
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        `Услуга: ${form.elements.service.value}`,
        date && `Желаемая дата: ${date}`,
        msg && `Пожелания: ${msg}`,
        'Промокод: CHILL20 (скидка 20% на первый визит)',
      ].filter(Boolean);
      const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;

      setStatus(`Спасибо, ${name.replace(/[<>&"]/g, '')}! Открываем WhatsApp — нажмите «Отправить». Не открылось? <a href="${url}" target="_blank" rel="noopener">Открыть вручную</a>`);
      const w = window.open(url, '_blank');
      if (!w) { location.href = url; return; }
      w.opener = null;
      /* страница «Спасибо»: имя и ссылка на заявку для повторного открытия */
      try {
        sessionStorage.setItem('chill-name', name);
        sessionStorage.setItem('chill-wa', url);
      } catch (err) {}
      setTimeout(() => { location.href = 'thanks.html'; }, 600);
    });
    form.addEventListener('input', () => { if (status.classList.contains('err')) setStatus('', false); });
  }

  if (reduce) return;

  /* ---------- Появление блоков при прокрутке (opacity + transform) ---------- */
  const groups = [
    ['#why .why-head > *', 'left'], ['#why .why-card', 'left'],
    ['#gallery .gallery-head > *', 'right'], ['#gallery .g-item', 'right'], ['#gallery .gallery-cta', 'up'],
    ['#services .services-head > *', 'up'], ['#services .service', 'right'],
    ['#ritual .ritual-visual', 'spin'], ['#ritual .ritual-text > *', 'right'], ['#ritual .steps li', 'right'],
    ['.offer', 'zoom'],
    ['#reviews .reviews-head > *', 'up'], ['#reviews .review', 'up'],
    ['#faq .faq-intro > *', 'left'], ['#faq details', 'left'],
    ['#booking .booking-intro > *', 'left'], ['#booking form', 'right'],
    ['footer .footer-inner > *', 'up'],
  ];
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      io.unobserve(el);
      setTimeout(() => el.style.setProperty('--i', 0), 1200);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -2% 0px' });

  groups.forEach(([sel, from]) => {
    document.querySelectorAll(sel).forEach((el, n) => {
      el.classList.add('rv');
      el.dataset.from = from;
      el.style.setProperty('--i', sel.includes('g-item') ? n % 3 : Math.min(n, 5));
      io.observe(el);
    });
  });

  /* ---------- Счётчики в первом экране ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const t0 = performance.now() + 300, dur = 1400;
    const fmt = v => dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ru-RU');
    el.textContent = fmt(0);
    const tick = now => {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();
