/* LUMI KIDS — админка: заказы, товары, категории, настройки магазина, Telegram, пароль. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var money = function (n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; };
function toast(t) { var el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 2800); }
function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function setPath(o, p, v) { var a = p.split('.'); for (var i = 0; i < a.length - 1; i++) { if (o[a[i]] == null) o[a[i]] = {}; o = o[a[i]]; } o[a[a.length - 1]] = v; }
function numVal(v) { return +String(v).replace(',', '.').replace(/[^\d.]/g, '') || 0; }
var D = null, tab = 'orders', orders = [], oSt = 'all', timer = null, seen = [], editId = null, pq = '', pcat = 'all';
try { seen = JSON.parse(localStorage.getItem('lk_seen') || '[]'); } catch (e) { }
var SIZES = ['74', '80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152', '158', '164'];

/* ===== вход и подключение ===== */
function gate() { $('#app').hidden = true; $('#gate').hidden = false; $('#gLogin').hidden = false; $('#gSetup').hidden = true; setTimeout(function () { $('#gPass').focus(); }, 50);
  Store.connected().then(function (c) { if (c === false) showSetup(); }); }
function showSetup() { $('#gLogin').hidden = true; $('#gSetup').hidden = false; }
function login() {
  var p = $('#gPass').value.trim(); if (!p) return toast('Введите пароль');
  $('#gateBtn').disabled = true;
  Store.login(p).then(function () { boot(false); }).catch(function (e) {
    if (e.status === 404) { showSetup(); return toast('Сайт ещё не подключён к серверу'); }
    toast(e.status === 401 ? 'Неверный пароль. Проверьте английскую раскладку' : e.status === 429 ? 'Слишком много попыток, подождите 15 минут' : 'Нет связи: ' + e.message);
  }).then(function () { $('#gateBtn').disabled = false; });
}
$('#gateBtn').onclick = login;
$('#gPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
$('#setupBtn').onclick = function () {
  var m = $('#sMaster').value.trim(), p1 = $('#sP1').value.trim(), p2 = $('#sP2').value.trim();
  if (!m) return toast('Введите ключ разработчика');
  if (!/^[\x21-\x7e]{6,}$/.test(p1)) return toast('Пароль: английские буквы и цифры, от 6 символов');
  if (p1 !== p2) return toast('Пароли не совпадают');
  var b = this; b.disabled = true;
  Store.register(m, p1).then(function () { return Store.login(p1); }).then(function () { toast('Сайт подключён ✓'); boot(true); })
    .catch(function (e) { toast(e.status === 403 ? 'Неверный ключ разработчика' : e.status === 409 ? 'Сайт уже подключён — войдите паролем' : 'Не получилось: ' + e.message); if (e.status === 409) gate(); })
    .then(function () { b.disabled = false; });
};
function boot(first) {
  $('#gate').hidden = true; $('#app').hidden = false;
  Store.load(true).then(function (d) {
    D = d; render();
    if (first) Store.save(D).then(function () { sv('ok'); }).catch(function () { });
  }).catch(function (e) { toast('Не загрузилось: ' + e.message); });
  loadOrders(true);
}
if (Store.authed()) boot(false); else gate();

/* ===== автосохранение ===== */
var saveT = null;
function sv(s) { var el = $('#sv'); el.className = 'sv ' + s; el.textContent = s === 'ok' ? '✓ сохранено' : s === 'err' ? '⚠ не сохранено' : 'сохраняю…'; }
function touch() {
  sv('busy'); clearTimeout(saveT);
  saveT = setTimeout(function () { Store.save(D).then(function () { sv('ok'); }).catch(function (e) { sv('err'); toast('Не сохранилось: ' + e.message); if (e.status === 401) gate(); }); }, 700);
}
window.addEventListener('beforeunload', function (e) { if ($('#sv') && $('#sv').classList.contains('busy')) { e.preventDefault(); e.returnValue = ''; } });

/* ===== вкладки ===== */
$('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
function go(t) { tab = t; editId = null; $$('#tabs button').forEach(function (x) { x.setAttribute('aria-selected', x.dataset.tab === t); }); render(); window.scrollTo(0, 0); }
function render() {
  clearInterval(timer); timer = null;
  if (tab === 'products' && editId) return vEdit();
  ({ orders: vOrders, products: vProducts, cats: vCats, shop: vShop, tg: vTg, admin: vAdmin })[tab]();
}
function F(label, path, o) {
  o = o || {}; var v = getPath(D, path);
  return '<label class="fld">' + label + (o.hint ? ' <span class="muted">' + o.hint + '</span>' : '') +
    (o.area ? '<textarea data-b="' + path + '" rows="' + (o.rows || 3) + '" placeholder="' + esc(o.ph || '') + '">' + esc(v == null ? '' : v) + '</textarea>'
      : '<input data-b="' + path + '"' + (o.num ? ' data-num="1" inputmode="numeric"' : '') + ' value="' + esc(v == null || (o.num && !v) ? '' : v) + '" placeholder="' + esc(o.ph || '') + '">') + '</label>';
}
function SW(label, path, small, cls) { return '<label class="sw' + (cls ? ' ' + cls : '') + '"><span>' + label + (small ? '<small>' + small + '</small>' : '') + '</span><input type="checkbox" data-b="' + path + '"' + (getPath(D, path) ? ' checked' : '') + '></label>'; }
function LINES(label, path, hint) { var v = getPath(D, path) || []; return '<label class="fld">' + label + (hint ? ' <span class="muted">' + hint + '</span>' : '') + '<textarea data-lines="' + path + '" rows="' + Math.max(3, v.length + 1) + '">' + esc(v.join('\n')) + '</textarea></label>'; }

/* ===== ЗАКАЗЫ ===== */
var STS = [['new', 'Новый', 'new'], ['ok', 'Подтверждён', 'ok'], ['sent', 'Отправлен', 'sent'], ['done', 'Выполнен', 'done'], ['cancel', 'Отменён', 'cancel']];
function stName(s) { for (var i = 0; i < STS.length; i++) if (STS[i][0] === s) return STS[i]; return STS[0]; }
function vOrders() {
  $('#view').innerHTML = '<h2 class="t">Заказы</h2><p class="note">Сюда приходят заказы с сайта — и оформленные на сайте, и отправленные в WhatsApp. Список обновляется сам каждые 20 секунд.</p><div class="chips" id="oSt"></div><div id="olist" class="empty">Загружаю…</div>';
  paintOrders(); loadOrders(false); timer = setInterval(function () { loadOrders(true); }, 20000);
}
function flat(o) { return o && o.data && typeof o.data === 'object' ? Object.assign({}, o.data, { id: o.id, status: o.status, created_at: o.created_at }) : o; }
function loadOrders(quiet) {
  Store.listOrders(300).then(function (r) {
    var l = (Array.isArray(r) ? r : (r && r.orders) || []).map(flat);
    var fresh = l.filter(function (o) { return o.status === 'new' && seen.indexOf(o.id) < 0; });
    if (quiet && fresh.length && orders.length) { toast('Новый заказ!'); beep(); }
    orders = l; paintOrders();
  }).catch(function (e) { var el = $('#olist'); if (el) el.textContent = 'Не загрузилось: ' + e.message; });
}
function beep() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .5); o.start(); o.stop(a.currentTime + .5); } catch (e) { } }
function paintOrders() {
  var n = orders.filter(function (o) { return o.status === 'new'; }).length; $('#dot').hidden = !n; $('#dot').textContent = n;
  if (!$('#oSt')) return;
  $('#oSt').innerHTML = [['all', 'Все']].concat(STS).map(function (s) { var c = s[0] === 'all' ? orders.length : orders.filter(function (o) { return (o.status || 'new') === s[0]; }).length; return '<button class="chip" data-ost="' + s[0] + '" aria-pressed="' + (oSt === s[0]) + '">' + s[1] + '<small>' + c + '</small></button>'; }).join('');
  var l = orders.filter(function (o) { return oSt === 'all' || (o.status || 'new') === oSt; });
  $('#olist').className = l.length ? '' : 'empty';
  $('#olist').innerHTML = l.length ? l.map(orderHTML).join('') : (orders.length ? 'В этом статусе заказов нет.' : 'Заказов пока нет. Когда клиент оформит заказ на сайте, он появится здесь.');
  seen = orders.map(function (o) { return o.id; }); try { localStorage.setItem('lk_seen', JSON.stringify(seen.slice(0, 500))); } catch (e) { }
}
function orderHTML(o) {
  var d = new Date(o.created_at || Date.now()), st = stName(o.status || 'new');
  var ph = String(o.phone || '').replace(/\D/g, ''); if (ph.length === 11 && ph[0] === '8') ph = '7' + ph.slice(1); if (ph.length === 10) ph = '7' + ph;
  var items = Array.isArray(o.items) ? o.items : [];
  var when = isNaN(d) ? '' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  var waText = 'Здравствуйте, ' + (o.name || '') + '! Это ' + (D && D.settings.name || 'LUMI KIDS') + '. Получили ваш заказ №' + o.id + '.';
  return '<div class="card ord' + ((o.status || 'new') === 'new' ? ' nw' : '') + '">' +
    '<div class="oh"><div><b>№' + esc(o.id) + ' · ' + esc(o.name || 'Без имени') + '</b><small>' + esc(when) + ' · ' + (o.via === 'whatsapp' ? 'через WhatsApp' : 'на сайте') + '</small></div><span class="st ' + st[2] + '">' + st[1] + '</span></div>' +
    '<div class="oc">' + (o.phone ? '<div>📞 <a href="tel:+' + ph + '">' + esc(o.phone) + '</a> · <a href="https://wa.me/' + ph + '?text=' + encodeURIComponent(waText) + '" target="_blank" rel="noopener">WhatsApp</a></div>' : '') +
      (o.delivery || o.city ? '<div>🚚 ' + esc([o.delivery, o.city].filter(Boolean).join(', ')) + '</div>' : '') +
      (o.note ? '<div>💬 ' + esc(o.note) + '</div>' : (!o.delivery && o.comment ? '<div>💬 ' + esc(o.comment) + '</div>' : '')) + '</div>' +
    (items.length ? '<div class="oi">' + items.map(function (x) { return '<div><span>' + esc(x.name) + ' × ' + (+x.qty || 1) + '</span><span>' + (x.price ? money(x.price * (+x.qty || 1)) : 'по запросу') + '</span></div>'; }).join('') +
      '<div class="sum"><span>Итого</span><span>' + (o.total ? money(o.total) : '—') + (o.tbd ? ' + уточнить' : '') + '</span></div></div>' : '') +
    '<div class="oa">' + STS.map(function (s) { return '<button class="btn" data-ord="' + esc(o.id) + '" data-s="' + s[0] + '" aria-pressed="' + ((o.status || 'new') === s[0]) + '">' + s[1] + '</button>'; }).join('') +
      '<button class="btn r" data-odel="' + esc(o.id) + '">Удалить</button></div></div>';
}

/* ===== ТОВАРЫ ===== */
function catName(id) { for (var i = 0; i < D.cats.length; i++) if (D.cats[i].id === id) return D.cats[i].name; return 'Без категории'; }
function thumb(p) { for (var i = 0; i < p.colors.length; i++) if (p.colors[i].imgs.length) return Store.img(p.colors[i].imgs[0]); return ''; }
function findP(id) { for (var i = 0; i < D.products.length; i++) if (D.products[i].id === id) return i; return -1; }
function vProducts() {
  $('#view').innerHTML = '<h2 class="t">Товары</h2><p class="note">Нажмите на товар, чтобы изменить название, фото, цвета и размеры. Цену можно поменять прямо в списке. Изменения сохраняются сами.</p>' +
    '<div class="tools"><button class="btn c" id="addP" type="button">+ Добавить товар</button><input id="pq" type="search" placeholder="Поиск товара" value="' + esc(pq) + '"><select id="pcat"><option value="all">Все категории</option>' + D.cats.map(function (c) { return '<option value="' + esc(c.id) + '"' + (pcat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="pl" id="pl"></div>';
  paintProducts();
  $('#pq').oninput = function () { pq = this.value; paintProducts(); };
  $('#pcat').onchange = function () { pcat = this.value; paintProducts(); };
  $('#addP').onclick = function () {
    var p = { id: Store.slug(), name: 'Новый товар', cat: pcat !== 'all' ? pcat : (D.cats[0] && D.cats[0].id) || '', price: 0, old: 0, badge: '', desc: '', sizes: [], own: false, on: true, soldout: false, colors: [{ name: '', hex: '#C8A27C', imgs: [] }] };
    D.products.unshift(p); touch(); editId = p.id; render(); window.scrollTo(0, 0);
  };
}
function paintProducts() {
  var q = pq.trim().toLowerCase(), l = D.products.filter(function (p) { return (pcat === 'all' || p.cat === pcat) && (!q || p.name.toLowerCase().indexOf(q) >= 0); });
  var filtered = !!q || pcat !== 'all';
  $('#pl').innerHTML = l.length ? l.map(function (p) {
    var i = findP(p.id), t = thumb(p);
    return '<div class="pr' + (p.on ? '' : ' off') + '" data-pid="' + esc(p.id) + '">' + (t ? '<img class="th" src="' + esc(t) + '" alt="" loading="lazy">' : '<div class="th"></div>') +
      '<div class="nm"><b data-edit="' + esc(p.id) + '">' + esc(p.name) + '</b><small>' + esc(catName(p.cat)) + ' · ' + p.colors.reduce(function (s, c) { return s + c.imgs.length; }, 0) + ' фото</small>' +
        '<div class="pin"><input data-price="' + esc(p.id) + '" inputmode="numeric" value="' + (p.price || '') + '" placeholder="по запросу" aria-label="Цена"><span>₸</span></div>' +
        '<div class="flags">' + (!p.on ? '<span class="flag">скрыт</span>' : '') + (p.soldout ? '<span class="flag r">нет в наличии</span>' : '') + (p.badge ? '<span class="flag">' + esc(p.badge) + '</span>' : '') + '</div></div>' +
      '<div class="ac"><button class="ib" data-edit="' + esc(p.id) + '" aria-label="Изменить">✎</button><button class="ib" data-vis="' + esc(p.id) + '" aria-label="' + (p.on ? 'Скрыть' : 'Показать') + '" title="' + (p.on ? 'Скрыть с сайта' : 'Показать на сайте') + '">' + (p.on ? '👁' : '🚫') + '</button>' +
        '<button class="ib" data-mv="-1" data-id="' + esc(p.id) + '" aria-label="Выше"' + (filtered || i === 0 ? ' disabled' : '') + '>↑</button><button class="ib" data-mv="1" data-id="' + esc(p.id) + '" aria-label="Ниже"' + (filtered || i === D.products.length - 1 ? ' disabled' : '') + '>↓</button></div></div>';
  }).join('') : '<div class="empty">Ничего не найдено.</div>';
}

/* ===== РЕДАКТОР ТОВАРА ===== */
function vEdit() {
  var i = findP(editId); if (i < 0) { editId = null; return vProducts(); }
  var p = D.products[i], b = 'products.' + i;
  var allSizes = SIZES.slice(); p.sizes.forEach(function (s) { if (allSizes.indexOf(s) < 0) allSizes.push(s); });
  $('#view').innerHTML = '<button class="back" id="back" type="button">← Все товары</button><h2 class="t">' + esc(p.name || 'Товар') + '</h2>' +
    '<div class="card">' + F('Название', b + '.name') +
      '<div class="g2"><label class="fld">Категория<select data-b="' + b + '.cat">' + D.cats.map(function (c) { return '<option value="' + esc(c.id) + '"' + (p.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld">Метка<input data-b="' + b + '.badge" list="badges" value="' + esc(p.badge) + '" placeholder="Хит, Новинка…"></label></div>' +
      '<datalist id="badges"><option>Хит</option><option>Новинка</option><option>Скидка</option><option>Последние размеры</option></datalist>' +
      '<div class="g2">' + F('Цена, ₸', b + '.price', { num: 1, ph: 'по запросу' }) + F('Старая цена, ₸', b + '.old', { num: 1, ph: 'для скидки' }) + '</div>' +
      '<p class="muted" style="margin:-6px 0 12px">Пустая цена — на сайте будет «Цена по запросу». Старая цена показывается зачёркнутой со скидкой в %.</p>' +
      F('Описание', b + '.desc', { area: 1, rows: 3, ph: 'Ткань, фасон, особенности' }) +
      SW('Показывать на сайте', b + '.on') + SW('Нет в наличии', b + '.soldout', 'Товар виден, но купить нельзя', 'red') + SW('Своё производство', b + '.own', 'Отметка «Своё производство» на карточке') +
    '</div>' +
    '<div class="card"><h3 class="c">Размеры</h3><div class="szs" id="szs">' + allSizes.map(function (s) { return '<button type="button" data-sz="' + esc(s) + '" aria-pressed="' + (p.sizes.indexOf(s) >= 0) + '">' + esc(s) + '</button>'; }).join('') + '</div>' +
      '<div class="addsz"><input id="nsz" placeholder="Свой размер: например 35, S, 3–4 года" maxlength="14"><button class="btn s" id="addSz" type="button">Добавить</button></div>' +
      '<p class="muted" style="margin-top:8px">Нажмите на размер, чтобы включить или выключить его. Если размеров нет (например, аксессуар), оставьте все выключенными.</p></div>' +
    '<div class="card"><h3 class="c">Цвета и фото</h3>' +
      '<div class="hintb">📷 <div><b>Первое фото — главное</b>, оно показывается в каталоге. Ставьте первым фото на ребёнке, а потом фото самой вещи. Стрелками ◀ ▶ меняйте порядок.</div></div>' +
      p.colors.map(function (c, ci) {
        return '<div class="col"><div class="colh"><input type="color" data-b="' + b + '.colors.' + ci + '.hex" value="' + esc(/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#c8a27c') + '" aria-label="Цвет">' +
          '<input type="text" data-b="' + b + '.colors.' + ci + '.name" value="' + esc(c.name) + '" placeholder="Название цвета (например: Бежевый)">' +
          '<button class="ib" data-cmv="-1" data-ci="' + ci + '"' + (ci === 0 ? ' disabled' : '') + ' aria-label="Цвет выше">↑</button><button class="ib r" data-cdel="' + ci + '" aria-label="Удалить цвет"' + (p.colors.length < 2 ? ' disabled' : '') + '>✕</button></div>' +
          '<div class="phs">' + c.imgs.map(function (im, k) {
            return '<div class="phi"><img src="' + esc(Store.img(im)) + '" alt="" loading="lazy">' + (k === 0 ? '<span class="m">Главное</span>' : '') +
              '<div class="bt"><button type="button" data-pmv="-1" data-ci="' + ci + '" data-k="' + k + '"' + (k === 0 ? ' disabled' : '') + ' aria-label="Левее">◀</button><button type="button" class="del" data-pdel="1" data-ci="' + ci + '" data-k="' + k + '" aria-label="Удалить фото">✕</button><button type="button" data-pmv="1" data-ci="' + ci + '" data-k="' + k + '"' + (k === c.imgs.length - 1 ? ' disabled' : '') + ' aria-label="Правее">▶</button></div></div>';
          }).join('') + '<button class="addph" type="button" data-up="' + ci + '"><div><span>+</span>Добавить фото</div></button></div></div>';
      }).join('') +
      '<button class="btn s" id="addC" type="button">+ Добавить цвет</button>' +
      '<p class="muted" style="margin-top:8px">Если у товара один цвет, название цвета можно не писать.</p></div>' +
    '<div class="card"><h3 class="c">Другие действия</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn s" href="./#p=' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener">Открыть на сайте ↗</a><button class="btn s" id="dupP" type="button">Сделать копию</button><button class="btn s r" id="delP" type="button">Удалить товар</button></div></div>' +
    '<button class="btn p" id="back2" type="button" style="width:100%">Готово</button>';
  $('#back').onclick = $('#back2').onclick = function () { editId = null; render(); window.scrollTo(0, 0); };
  $('#addSz').onclick = function () { var v = $('#nsz').value.trim(); if (!v) return; if (p.sizes.indexOf(v) < 0) { p.sizes.push(v); sortSizes(p); touch(); } vEdit(); };
  $('#nsz').onkeydown = function (e) { if (e.key === 'Enter') $('#addSz').click(); };
  $('#addC').onclick = function () { p.colors.push({ name: '', hex: '#C8A27C', imgs: [] }); touch(); vEdit(); };
  $('#dupP').onclick = function () { var c = JSON.parse(JSON.stringify(p)); c.id = Store.slug(); c.name = p.name + ' (копия)'; D.products.splice(i + 1, 0, c); touch(); editId = c.id; vEdit(); window.scrollTo(0, 0); toast('Копия создана'); };
  $('#delP').onclick = function () { if (!confirm('Удалить «' + p.name + '»? Это нельзя отменить.')) return; D.products.splice(i, 1); touch(); editId = null; render(); toast('Товар удалён'); };
}
function sortSizes(p) { p.sizes.sort(function (a, b) { var na = parseFloat(a), nb = parseFloat(b); if (!isNaN(na) && !isNaN(nb)) return na - nb; if (!isNaN(na)) return -1; if (!isNaN(nb)) return 1; return 0; }); }

/* загрузка фото: сжимаем в браузере до 1400 px */
var upTarget = null;
function compress(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var max = 1400, r = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * r), h = Math.round(im.naturalHeight * r);
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url);
      var q = .84;
      (function enc() { cv.toBlob(function (b) { if (!b) return rej(new Error('не удалось обработать фото')); if (b.size > 900000 && q > .5) { q -= .12; return enc(); } res(b); }, 'image/jpeg', q); })();
    };
    im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('не удалось открыть фото')); };
    im.src = url;
  });
}
$('#files').addEventListener('change', function () {
  var fs = Array.prototype.slice.call(this.files || []); this.value = ''; if (!fs.length || !upTarget) return;
  var t = upTarget, done = 0, bad = 0, box = document.createElement('div'); box.className = 'up'; document.body.appendChild(box);
  function upd() { box.textContent = 'Загружаю фото ' + Math.min(done + bad + 1, fs.length) + ' из ' + fs.length + '…'; }
  upd();
  fs.reduce(function (pr, f) {
    return pr.then(function () { return compress(f).then(Store.upload).then(function (id) { t.arr.push(id); done++; touch(); if (t.after) t.after(); }).catch(function (e) { bad++; toast('Фото не загрузилось: ' + e.message); }).then(upd); });
  }, Promise.resolve()).then(function () { box.remove(); if (done) toast('Загружено фото: ' + done); });
});
function pickFiles(arr, after) { upTarget = { arr: arr, after: after }; $('#files').click(); }
function usedElsewhere(id) { var n = 0; D.products.forEach(function (p) { p.colors.forEach(function (c) { c.imgs.forEach(function (x) { if (x === id) n++; }); }); }); (D.settings.heroImgs || []).forEach(function (x) { if (x === id) n++; }); return n > 0; }

/* ===== КАТЕГОРИИ ===== */
function vCats() {
  $('#view').innerHTML = '<h2 class="t">Категории</h2><p class="note">Категории — это кнопки над каталогом на сайте. Пустые категории на сайте не показываются.</p>' +
    '<div class="card"><div class="rows">' + D.cats.map(function (c, i) {
      var n = D.products.filter(function (p) { return p.cat === c.id; }).length;
      return '<div class="rw"><input data-b="cats.' + i + '.name" value="' + esc(c.name) + '" aria-label="Название категории"><span class="muted" style="min-width:58px;text-align:right">' + n + ' тов.</span>' +
        '<button class="ib" data-catmv="-1" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Выше">↑</button><button class="ib" data-catmv="1" data-i="' + i + '"' + (i === D.cats.length - 1 ? ' disabled' : '') + ' aria-label="Ниже">↓</button><button class="ib r" data-catdel="' + i + '" aria-label="Удалить">✕</button></div>';
    }).join('') + '</div><div class="addsz"><input id="ncat" placeholder="Новая категория: например, Обувь"><button class="btn s c" id="addCat" type="button">Добавить</button></div></div>';
  $('#addCat').onclick = function () { var v = $('#ncat').value.trim(); if (!v) return toast('Напишите название'); D.cats.push({ id: 'c' + Date.now().toString(36), name: v }); touch(); vCats(); toast('Категория добавлена'); };
  $('#ncat').onkeydown = function (e) { if (e.key === 'Enter') $('#addCat').click(); };
}

/* ===== МАГАЗИН (настройки) ===== */
function vShop() {
  var S = D.settings;
  $('#view').innerHTML = '<h2 class="t">Магазин</h2><p class="note">Тексты и контакты на сайте. Изменения сохраняются сами.</p>' +
    '<div class="card"><h3 class="c">Основное</h3>' + F('Название магазина', 'settings.name') + F('Подпись', 'settings.tagline', { ph: 'Детская одежда · 2–12 лет' }) +
      '<div class="g2">' + F('WhatsApp для заказов', 'settings.wa', { hint: 'только цифры, с 7', ph: '77026288740' }) + F('Телефон на сайте', 'settings.phone', { ph: '+7 702 628 87 40' }) + '</div>' +
      '<div class="g2">' + F('Instagram', 'settings.instagram', { ph: 'lumikids.kz' }) + F('Город', 'settings.city', { ph: 'Казахстан' }) + '</div></div>' +
    '<div class="card"><h3 class="c">Строка сверху</h3>' + SW('Показывать', 'settings.announce.on') + F('Текст', 'settings.announce.text', { ph: 'Скидка 10% на всё до воскресенья' }) + '</div>' +
    '<div class="card"><h3 class="c">Главный экран</h3>' + F('Заголовок', 'settings.heroTitle', { hint: 'слова в *звёздочках* будут курсивом' }) + F('Текст под заголовком', 'settings.heroSub', { area: 1, rows: 3 }) +
      '<div class="fld">Фото на главном <span class="muted">нажмите, чтобы выбрать другое</span></div><div class="hero3">' + [0, 1, 2].map(function (k) { var im = S.heroImgs[k]; return '<button class="phi" type="button" data-hero="' + k + '">' + (im ? '<img src="' + esc(Store.img(im)) + '" alt="">' : '<div class="addph" style="height:100%"><div><span>+</span>Выбрать</div></div>') + (k === 0 ? '<span class="m">Большое</span>' : '') + '</button>'; }).join('') + '</div></div>' +
    '<div class="card"><h3 class="c">О магазине</h3>' + F('Заголовок блока', 'settings.aboutTitle') + F('Текст', 'settings.aboutText', { area: 1, rows: 4 }) + LINES('Преимущества', 'settings.features', 'каждое с новой строки') + '</div>' +
    '<div class="card"><h3 class="c">Доставка и заказ</h3>' + LINES('Способы доставки', 'settings.delivery', 'каждый с новой строки — клиент выбирает при заказе') + F('Текст после заказа', 'settings.orderNote', { area: 1, rows: 2 }) + '</div>' +
    '<div class="card"><h3 class="c">Таблица размеров</h3><div class="rows">' + S.sizeGuide.map(function (g, i) {
      return '<div class="rw"><input data-b="settings.sizeGuide.' + i + '.size" value="' + esc(g.size) + '" placeholder="Размер" style="flex:0 0 90px"><input data-b="settings.sizeGuide.' + i + '.age" value="' + esc(g.age) + '" placeholder="Возраст / рост"><button class="ib r" data-sgdel="' + i + '" aria-label="Удалить строку">✕</button></div>';
    }).join('') + '</div><button class="btn s" id="addSg" type="button">+ Строка</button></div>';
  $('#addSg').onclick = function () { S.sizeGuide.push({ size: '', age: '' }); touch(); vShop(); };
}
function heroPicker(k) {
  var all = []; D.products.forEach(function (p) { p.colors.forEach(function (c) { c.imgs.forEach(function (im) { if (all.indexOf(im) < 0) all.push(im); }); }); });
  var el = document.createElement('div'); el.className = 'pick';
  el.innerHTML = '<div class="in"><h3 class="c">Выберите фото</h3><p class="muted" style="margin-bottom:10px">Лучше всего смотрятся фото детей в полный рост.</p><div class="phs">' + all.map(function (im) { return '<button type="button" data-im="' + esc(im) + '"><img src="' + esc(Store.img(im)) + '" alt="" loading="lazy"></button>'; }).join('') + '</div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn s" type="button" data-hup="1">📷 Загрузить новое</button><button class="btn s" type="button" data-x="1" style="margin-left:auto">Закрыть</button></div></div>';
  document.body.appendChild(el);
  el.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (e.target === el || (b && b.dataset.x)) return el.remove();
    if (!b) return;
    if (b.dataset.im) { D.settings.heroImgs[k] = b.dataset.im; D.settings.heroImgs = D.settings.heroImgs.filter(Boolean); touch(); el.remove(); vShop(); }
    if (b.dataset.hup) { var tmp = []; el.remove(); pickFiles(tmp, function () { D.settings.heroImgs[k] = tmp[tmp.length - 1]; touch(); if (tab === 'shop') vShop(); }); }
  });
}

/* ===== TELEGRAM ===== */
var tgSt = null, tgUrl = '';
function vTg() {
  var h = '<h2 class="t">Telegram</h2><p class="note">Новые заказы с сайта приходят в Telegram сразу, даже если админка закрыта.</p>';
  if (!tgSt) { $('#view').innerHTML = h + '<div class="empty">Загружаю…</div>'; Store.tgInfo().then(function (r) { tgSt = r || {}; }).catch(function (e) { tgSt = { err: e.message }; }).then(function () { if (tab === 'tg') vTg(); }); return; }
  if (tgSt.err) { $('#view').innerHTML = h + '<div class="card"><h3 class="c">Нет связи</h3><p class="muted">' + esc(tgSt.err) + '</p><button class="btn s" id="tgRef">Повторить</button></div>'; $('#tgRef').onclick = function () { tgSt = null; tgUrl = ''; vTg(); }; return; }
  if (!tgSt.bot) { $('#view').innerHTML = h + '<div class="card"><h3 class="c">Бот ещё не настроен</h3><p class="muted">Чтобы включить уведомления, разработчику сайта нужно один раз подключить Telegram-бота. После этого здесь появится кнопка «Подключить».</p></div>'; return; }
  var n = +tgSt.chats || 0;
  $('#view').innerHTML = h + '<div class="card"><h3 class="c">Бот @' + esc(tgSt.bot) + '</h3><p class="muted" style="margin-bottom:12px">' + (n ? '✅ Подключено чатов: ' + n : 'Пока никто не подключён') + '</p>' +
    (tgUrl ? '<a class="btn p" href="' + esc(tgUrl) + '" target="_blank" rel="noopener">Открыть Telegram</a>' : '<button class="btn p" id="tgLink">' + (n ? 'Подключить ещё' : 'Подключить') + '</button>') + (n ? ' <button class="btn r" id="tgOff">Отключить</button>' : '') + '</div>' +
    '<div class="card"><h3 class="c">Как подключить</h3><ol style="padding-left:20px;display:grid;gap:6px;color:var(--muted);font-size:.9rem"><li>Нажмите «Подключить» — появится кнопка «Открыть Telegram».</li><li>В Telegram нажмите «Запустить» (Start).</li><li>Готово. Так можно подключить и себя, и помощника.</li></ol></div>';
  if ($('#tgLink')) $('#tgLink').onclick = function () { this.disabled = true; Store.tgLink().then(function (r) { tgUrl = r.url; vTg(); window.open(r.url, '_blank'); }).catch(function (e) { toast('Не получилось: ' + e.message); vTg(); }); };
  if ($('#tgOff')) $('#tgOff').onclick = function () { if (!confirm('Отключить уведомления в Telegram?')) return; Store.tgOff().then(function () { tgSt = null; tgUrl = ''; toast('Telegram отключён'); vTg(); }).catch(function (e) { toast(e.message); }); };
}

/* ===== ПАРОЛЬ ===== */
function vAdmin() {
  $('#view').innerHTML = '<h2 class="t">Пароль и вход</h2>' +
    '<div class="card"><h3 class="c">🔑 Сменить пароль</h3><p class="muted" style="margin-bottom:10px">Английские буквы и цифры, минимум 6 символов. После смены войдите заново.</p>' +
      '<label class="fld">Новый пароль<input id="p1" type="password" autocomplete="new-password" autocapitalize="off" spellcheck="false"></label>' +
      '<label class="fld">Ещё раз<input id="p2" type="password" autocomplete="new-password" autocapitalize="off" spellcheck="false"></label><button class="btn" id="savePass">Сменить пароль</button></div>' +
    '<div class="card"><h3 class="c">🚪 Выход</h3><p class="muted" style="margin-bottom:10px">Вход держится 12 часов, потом нужно ввести пароль снова.</p><button class="btn" id="exit2">Выйти</button></div>' +
    '<div class="card"><h3 class="c">📄 Вернуть начальный каталог</h3><p class="muted" style="margin-bottom:10px">Заменит товары, категории и тексты первоначальной версией сайта. Заказы не трогает. Ваши изменения пропадут.</p><button class="btn r" id="reset">Вернуть начальный каталог</button></div>';
  $('#savePass').onclick = function () {
    var a = $('#p1').value.trim(), b = $('#p2').value.trim();
    if (!/^[\x21-\x7e]{6,}$/.test(a)) return toast('Английские буквы и цифры, от 6 символов'); if (a !== b) return toast('Пароли не совпадают');
    Store.changePassword(a).then(function () { toast('Пароль изменён. Войдите заново'); Store.logout(); setTimeout(function () { location.reload(); }, 1200); }).catch(function (e) { toast('Не получилось: ' + e.message); });
  };
  $('#exit2').onclick = function () { Store.logout(); location.reload(); };
  $('#reset').onclick = function () { if (!confirm('Точно вернуть начальный каталог? Все ваши изменения товаров пропадут.')) return; Store.reset().then(function (d) { D = d; toast('Готово'); sv('ok'); }).catch(function (e) { toast('Не получилось: ' + e.message); }); };
}

/* ===== общие события ===== */
document.addEventListener('input', function (e) {
  var el = e.target;
  if (el.dataset.b && el.type !== 'checkbox') {
    if (el.tagName === 'SELECT') return;
    var v = el.dataset.num ? numVal(el.value) : el.value;
    if (el.dataset.b === 'settings.wa') v = String(v).replace(/\D/g, '');
    setPath(D, el.dataset.b, v); touch();
    if (/^products\.\d+\.name$/.test(el.dataset.b)) { var h = $('h2.t'); if (h) h.textContent = el.value || 'Товар'; }
    return;
  }
  if (el.dataset.lines) { setPath(D, el.dataset.lines, el.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)); touch(); return; }
  if (el.dataset.price) { var i = findP(el.dataset.price); if (i >= 0) { D.products[i].price = numVal(el.value); touch(); } }
});
document.addEventListener('change', function (e) {
  var el = e.target; if (!el.dataset.b) return;
  if (el.type === 'checkbox') { setPath(D, el.dataset.b, el.checked); touch(); if (tab === 'products' && editId) { /* обновим метки */ } return; }
  if (el.tagName === 'SELECT' || el.type === 'color') { setPath(D, el.dataset.b, el.value); touch(); }
});
document.addEventListener('click', function (e) {
  var t = e.target.closest('button,[data-edit]'); if (!t) return;
  var d = t.dataset;
  /* заказы */
  if (d.ost) { oSt = d.ost; return paintOrders(); }
  if (d.ord && d.s) { var o = orders.filter(function (x) { return String(x.id) === d.ord; })[0]; if (!o) return; var old = o.status; o.status = d.s; paintOrders();
    return Store.setStatus(d.ord, d.s).then(function () { toast('Статус: ' + stName(d.s)[1]); }).catch(function (er) { o.status = old; paintOrders(); toast('Не получилось: ' + er.message); }); }
  if (d.odel) { if (!confirm('Удалить заказ №' + d.odel + '?')) return; return Store.removeOrder(d.odel).then(function () { orders = orders.filter(function (x) { return String(x.id) !== d.odel; }); paintOrders(); toast('Заказ удалён'); }).catch(function (er) { toast('Не получилось: ' + er.message); }); }
  /* список товаров */
  if (d.edit) { editId = d.edit; render(); window.scrollTo(0, 0); return; }
  if (d.vis) { var vi = findP(d.vis); D.products[vi].on = !D.products[vi].on; touch(); paintProducts(); toast(D.products[vi].on ? 'Товар показан на сайте' : 'Товар скрыт с сайта'); return; }
  if (d.mv && d.id) { var a = findP(d.id), bb = a + (+d.mv); if (bb < 0 || bb >= D.products.length) return; var tmp = D.products[a]; D.products[a] = D.products[bb]; D.products[bb] = tmp; touch(); paintProducts(); return; }
  /* редактор товара */
  var pi = editId ? findP(editId) : -1, P = pi >= 0 ? D.products[pi] : null;
  if (P) {
    if (d.sz) { var si = P.sizes.indexOf(d.sz); if (si >= 0) P.sizes.splice(si, 1); else { P.sizes.push(d.sz); sortSizes(P); } t.setAttribute('aria-pressed', si < 0); touch(); return; }
    if (d.up) { var col = P.colors[+d.up]; return pickFiles(col.imgs, function () { if (editId === P.id && tab === 'products') vEdit(); }); }
    if (d.pmv) { var c1 = P.colors[+d.ci].imgs, k = +d.k, k2 = k + (+d.pmv); if (k2 < 0 || k2 >= c1.length) return; var x = c1[k]; c1[k] = c1[k2]; c1[k2] = x; touch(); return vEdit(); }
    if (d.pdel) { var c2 = P.colors[+d.ci].imgs; if (!confirm('Удалить это фото?')) return; var rm = c2.splice(+d.k, 1)[0]; touch(); if (/^\d+$/.test(String(rm)) && !usedElsewhere(rm)) Store.removeImg(rm).catch(function () { }); return vEdit(); }
    if (d.cmv) { var c = +d.ci, c3 = c + (+d.cmv); if (c3 < 0) return; var y = P.colors[c]; P.colors[c] = P.colors[c3]; P.colors[c3] = y; touch(); return vEdit(); }
    if (d.cdel) { if (P.colors.length < 2) return; if (!confirm('Удалить цвет «' + (P.colors[+d.cdel].name || 'без названия') + '» вместе с его фото?')) return; P.colors.splice(+d.cdel, 1); touch(); return vEdit(); }
  }
  /* категории */
  if (d.catmv) { var ci2 = +d.i, cj = ci2 + (+d.catmv); var z = D.cats[ci2]; D.cats[ci2] = D.cats[cj]; D.cats[cj] = z; touch(); return vCats(); }
  if (d.catdel) {
    var cc = D.cats[+d.catdel], used = D.products.filter(function (p) { return p.cat === cc.id; }).length;
    if (used) return toast('В категории ' + used + ' тов. Сначала перенесите их в другую категорию');
    if (!confirm('Удалить категорию «' + cc.name + '»?')) return; D.cats.splice(+d.catdel, 1); touch(); return vCats();
  }
  /* магазин */
  if (d.hero) return heroPicker(+d.hero);
  if (d.sgdel) { D.settings.sizeGuide.splice(+d.sgdel, 1); touch(); return vShop(); }
});
})();
