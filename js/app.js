/* ============================================================
   StableShop — Cart (localStorage)
   Добавление товаров из каталога, счётчик в шапке.
   ------------------------------------------------------------
   Формат элемента корзины:
   { id: string, title: string, price: number, image: string, qty: number }
   ============================================================ */

(() => {
  const CART_KEY = 'cart';

  /* ---------- Конфигурация поведения после клика ---------- */
  const NAVIGATE_AFTER_ADD = false;      // true → сразу уйти на cart.html
  const NAVIGATE_TARGET = 'cart.html';   // куда переходить, если включено

  /* ----------------------- Утилиты ------------------------ */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateBadge(items);
  }

  function moneyToNumber(text) {
    // "7 990 ₽" → 7990
    const num = text.replace(/[^\d.,]/g, '').replace(/\s+/g, '').replace(',', '.');
    return Number(num || 0);
  }

  function slugify(str) {
    return String(str).toLowerCase()
      .replace(/[^\wа-яё]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* --------- Получение данных из карточки товара ---------- */
  function readProductFromCard(cardEl) {
    if (!cardEl) return null;

    // id: приоритет data-id; иначе — сгенерируем из заголовка
    const title = $('.card-title', cardEl)?.textContent.trim() || 'Товар';
    const id = cardEl.dataset.id || slugify(title);

    // price: из .price
    const priceText = $('.price', cardEl)?.textContent || '0';
    const price = moneyToNumber(priceText);

    // image: видимый слайд (opacity:1). Если не нашли — первый <img> в .slides
    let image = null;
    const visible = $('.slides img[style*="opacity: 1"], .slides img[style*="opacity:1"]', cardEl);
    if (visible && visible.getAttribute('src')) {
      image = visible.getAttribute('src');
    } else {
      image = $('.slides img', cardEl)?.getAttribute('src') || '';
    }

    return { id, title, price, image };
  }

  /* --------------------- Операции с корзиной --------------- */
  function addToCart(product, qty = 1) {
    const items = loadCart();
    const idx = items.findIndex(it => it.id === product.id);
    if (idx >= 0) {
      items[idx].qty = Math.min(999, (items[idx].qty || 1) + qty);
    } else {
      items.push({ ...product, qty: Math.max(1, qty) });
    }
    saveCart(items);
    return items;
  }

  function cartCount(items = loadCart()) {
    return items.reduce((sum, it) => sum + (it.qty || 0), 0);
  }

  /* --------------------- Бэйдж в шапке --------------------- */
  function updateBadge(items = loadCart()) {
    const badge = $('#cart-count');
    if (!badge) return;
    const count = cartCount(items);
    badge.textContent = count > 0 ? `(${count})` : '';
  }

  /* ------------------ Визуальный отклик -------------------- */
  function flashButton(btn) {
    if (!btn) return;
    btn.style.transition = 'transform .12s ease, filter .12s ease';
    btn.style.transform = 'scale(0.98)';
    btn.style.filter = 'brightness(1.05)';
    setTimeout(() => {
      btn.style.transform = '';
      btn.style.filter = '';
    }, 150);
  }

  function toast(msg) {
    // минималистичный тост без CSS-фреймворков
    let el = document.createElement('div');
    el.textContent = msg;
    el.setAttribute('role', 'status');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.bottom = '24px';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '12px';
    el.style.background = '#0ea5e9';
    el.style.color = '#fff';
    el.style.fontWeight = '700';
    el.style.boxShadow = '0 10px 30px rgba(2,6,23,.18)';
    el.style.zIndex = 1000;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  /* -------------------- Обработчики кликов ----------------- */
  document.addEventListener('click', (e) => {
    // Ищем клик по кнопке "Заказать" внутри карточки
    const btn = e.target.closest('.card .btn');
    if (!btn) return;

    // Определяем карточку
    const card = e.target.closest('.card');
    if (!card) return;

    // Перехватываем переход по ссылке (если это <a href="cart.html">)
    e.preventDefault();

    // Собираем данные и кладём в localStorage
    const product = readProductFromCard(card);
    addToCart(product, 1);

    // Визуально отзовёмся
    flashButton(btn);
    toast('Добавлено в корзину');

    // По желанию — сразу уйти в корзину
    if (NAVIGATE_AFTER_ADD) {
      setTimeout(() => { location.href = NAVIGATE_TARGET; }, 200);
    }
  });

  /* --------------------- Инициализация ---------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Обновим бэйдж при загрузке страницы
    updateBadge();

    // Если у тебя есть радиокнопки в превью (name="gN"),
    // то видимость слайдов управляет CSS через :has().
    // Для корректного извлечения "текущего" изображения в readProductFromCard()
    // достаточно, чтобы CSS у выбранного слайда менял opacity на 1.
  });
})();
