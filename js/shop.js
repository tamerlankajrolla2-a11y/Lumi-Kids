/* ALISA KIDS — витрина: каталог, карточка товара, корзина, оформление заказа, настройки. */
(function () {
'use strict';
document.documentElement.classList.add('js');
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var money = function (n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; };
function ls(k, v) { try { if (v === undefined) { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
function toast(t) { var el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 2400); }
var ICON = function (id, cls) { return '<svg class="' + (cls || 'i') + '"><use href="#' + id + '"/></svg>'; };

/* ===== разработчик сайта (пункт «Хотите похожий сайт?») ===== */
var DEV_WA = '77476128411', DEV_PRETTY = '8 747 612 84 11';

var D = null, S = {}, CART = [], cat = 'all', q = '', sort = 'def', fsize = '';
function waUrl(text, num) { return 'https://wa.me/' + (num || S.wa || '77026288740') + (text ? '?text=' + encodeURIComponent(text) : ''); }
function catName(id) { for (var i = 0; i < D.cats.length; i++) if (D.cats[i].id === id) return D.cats[i].name; return ''; }
function visible() { return D.products.filter(function (p) { return p.on; }); }
function findP(id) { for (var i = 0; i < D.products.length; i++) if (D.products[i].id === id) return D.products[i]; return null; }
function firstImg(p, ci) { var c = p.colors[ci || 0] || p.colors[0]; if (c && c.imgs.length) return c.imgs[0]; for (var i = 0; i < p.colors.length; i++) if (p.colors[i].imgs.length) return p.colors[i].imgs[0]; return ''; }
function imgCount(p) { return p.colors.reduce(function (s, c) { return s + c.imgs.length; }, 0); }
function sizeAge(s) { var g = S.sizeGuide || []; for (var i = 0; i < g.length; i++) if (String(g[i].size) === String(s)) return g[i].age; return ''; }

/* ===== настройки вида ===== */
function applyPrefs() {
  var dark = ls('lk_dark') === 1, big = ls('lk_big') === 1;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.big = big ? 'true' : 'false';
  var m = $('meta[name=theme-color]'); if (m) m.content = dark ? '#191411' : '#F6EFE7';
  var a = $('#swDark'), b = $('#swBig'); if (a) a.setAttribute('aria-checked', dark); if (b) b.setAttribute('aria-checked', big);
}
applyPrefs();

/* ===== страница ===== */
function paintPage() {
  S = D.settings;
  var nm = String(S.name || 'ALISA KIDS').trim(), parts = nm.split(/\s+/);
  var brand = parts.length > 1 ? esc(parts.slice(0, -1).join(' ')) + ' <i>' + esc(parts[parts.length - 1]) + '</i>' : esc(nm);
  $$('.brand').forEach(function (b) { b.innerHTML = brand; });
  document.title = nm + ' — детская одежда · Казахстан';
  $('#ann').hidden = !(S.announce && S.announce.on && S.announce.text); $('#annT').textContent = (S.announce && S.announce.text) || '';
  if (S.tagline) { $('#tagline').textContent = S.tagline; $('#fTag').textContent = S.tagline; }
  if (S.heroTitle) {
    /* слова в *звёздочках* выделяются курсивом */
    $('#heroT').innerHTML = esc(S.heroTitle).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\*/g, '');
  }
  $('#heroS').textContent = S.heroSub || '';
  var hi = S.heroImgs.length ? S.heroImgs : [];
  if (hi.length < 3) visible().forEach(function (p) { var f = firstImg(p); if (f && hi.indexOf(f) < 0 && hi.length < 3) hi.push(f); });
  ['#h1i', '#h2i', '#h3i'].forEach(function (s, i) { var el = $(s); if (hi[i]) { el.src = Store.img(hi[i]); el.parentNode.hidden = false; } else el.parentNode.hidden = true; });
  var prices = visible().map(function (p) { return p.price; }).filter(function (x) { return x > 0; });
  $('#stFrom').textContent = prices.length ? money(Math.min.apply(null, prices)) : 'по запросу';
  var all = []; visible().forEach(function (p) { p.sizes.forEach(function (s) { var n = parseInt(s, 10); if (n) all.push(n); }); });
  $('#stSizes').textContent = all.length ? (Math.min.apply(null, all) === Math.max.apply(null, all) ? all[0] : Math.min.apply(null, all) + '–' + Math.max.apply(null, all)) : '2–12';
  $('#sizeGrid').innerHTML = (S.sizeGuide || []).map(function (g) { return '<button type="button" class="sz rv" data-size="' + esc(g.size) + '" aria-pressed="false"><b>' + esc(g.size) + '</b><span>' + esc(g.age) + '</span><em></em></button>'; }).join('');
  $('#sizes').hidden = !(S.sizeGuide || []).length;
  $('#aboutT').textContent = S.aboutTitle || nm;
  $('#aboutX').textContent = S.aboutText || '';
  $('#feat').innerHTML = (S.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
  if (S.orderNote) $('#howNote').textContent = S.orderNote;
  var ph = S.phone || ('+' + S.wa);
  $('#cPhone').textContent = ph; $('#cPhone').href = 'tel:+' + String(ph).replace(/\D/g, '').replace(/^8/, '7');
  $('#cCity').textContent = (S.city ? S.city + ' · ' : '') + 'Доставка по Казахстану, СНГ и миру';
  var ig = String(S.instagram || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
  $('#soc').innerHTML = ig ? '<a href="https://instagram.com/' + esc(ig) + '" target="_blank" rel="noopener">' + ICON('ig') + '@' + esc(ig) + '</a>' : '';
  $$('.wa-link').forEach(function (a) { a.href = waUrl(a.dataset.msg || ('Здравствуйте! Пишу с сайта ' + nm + '.')); });
  $('#yr').textContent = new Date().getFullYear();
  observe();
}

/* ===== каталог ===== */
/* ===== фильтр по размеру ===== */
function hasSize(p, s) { return p.sizes.some(function (x) { return String(x) === String(s); }); }
function sizeOk(p) { return !fsize || hasSize(p, fsize); }
function sizeCount(s) { return visible().filter(function (p) { return hasSize(p, s); }).length; }
function sizeList() {
  var seen = {}, out = [], extra = [];
  (S.sizeGuide || []).forEach(function (g) { var k = String(g.size); if (!seen[k]) { seen[k] = 1; out.push(k); } });
  visible().forEach(function (p) { p.sizes.forEach(function (x) { var k = String(x); if (!seen[k]) { seen[k] = 1; extra.push(k); } }); });
  extra.sort(function (a, b) { return (parseFloat(a) || 0) - (parseFloat(b) || 0); });
  return out.concat(extra);
}
/* ряд размеров над каталогом + подсветка карточек в разделе «Размеры» */
function paintSizes() {
  var all = sizeList(), box = $('#szf');
  if (fsize && all.indexOf(fsize) < 0) fsize = '';
  box.hidden = !all.length;
  box.innerHTML = all.length ? '<span class="szl">Размер</span><button type="button" class="chip sm" data-fs="" aria-pressed="' + (!fsize) + '">Любой</button>' +
    all.map(function (s) { var a = sizeAge(s), n = sizeCount(s); return '<button type="button" class="chip sm' + (n ? '' : ' none') + '" data-fs="' + esc(s) + '" aria-pressed="' + (fsize === s) + '">' + esc(s) + (a ? '<small>' + esc(a) + '</small>' : '') + '</button>'; }).join('') : '';
  $$('#sizeGrid .sz').forEach(function (b) {
    var s = b.dataset.size, n = sizeCount(s), em = $('em', b);
    b.setAttribute('aria-pressed', fsize === s); b.classList.toggle('none', !n);
    b.setAttribute('aria-label', 'Размер ' + s + ', ' + sizeAge(s) + (n ? ': ' + plural(n, 'товар', 'товара', 'товаров') : ': пока нет товаров'));
    if (em) em.textContent = n ? plural(n, 'товар', 'товара', 'товаров') : 'пока нет';
  });
}
function paintSizeBar(n) {
  var bar = $('#szbar'); if (!bar) return;
  if (!fsize) { bar.hidden = true; bar.innerHTML = ''; return; }
  var a = sizeAge(fsize);
  bar.hidden = false;
  bar.innerHTML = '<span>Размер <b>' + esc(fsize) + '</b>' + (a ? ' · ' + esc(a) : '') + ': ' + (n ? plural(n, 'товар', 'товара', 'товаров') : 'пока ничего нет') + '</span><button type="button" data-fs="">Показать все</button>';
}
function setSize(s, scroll) {
  fsize = (s && fsize !== s) ? s : '';
  paintCats(); paintSizes(); paintGrid();
  if (scroll && fsize) {
    var t = $('#catalog .tools'), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (t && t.scrollIntoView) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}

function paintCats() {
  var vis = visible().filter(sizeOk), used = D.cats.filter(function (c) { return vis.some(function (p) { return p.cat === c.id; }); });
  if (cat !== 'all' && !used.some(function (c) { return c.id === cat; })) cat = 'all';
  $('#cats').innerHTML = '<button class="chip" data-cat="all" aria-pressed="' + (cat === 'all') + '">Все<small>' + vis.length + '</small></button>' +
    used.map(function (c) { var n = vis.filter(function (p) { return p.cat === c.id; }).length; return '<button class="chip" data-cat="' + esc(c.id) + '" aria-pressed="' + (cat === c.id) + '">' + esc(c.name) + '<small>' + n + '</small></button>'; }).join('');
}
function list() {
  var qq = q.trim().toLowerCase(), arr = visible().filter(function (p) {
    if (cat !== 'all' && p.cat !== cat) return false;
    if (!sizeOk(p)) return false;
    if (!qq) return true;
    var hay = (p.name + ' ' + p.desc + ' ' + catName(p.cat) + ' ' + p.colors.map(function (c) { return c.name; }).join(' ')).toLowerCase();
    return qq.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  });
  var idx = D.products.slice();
  if (sort === 'asc' || sort === 'desc') arr.sort(function (a, b) {
    var pa = a.price || (sort === 'asc' ? 1e12 : -1), pb = b.price || (sort === 'asc' ? 1e12 : -1);
    return sort === 'asc' ? pa - pb : pb - pa;
  });
  else if (sort === 'new') arr.sort(function (a, b) { var na = /нов/i.test(a.badge) ? 0 : 1, nb = /нов/i.test(b.badge) ? 0 : 1; return na - nb || idx.indexOf(b) - idx.indexOf(a); });
  /* нет в наличии — в конец */
  arr.sort(function (a, b) { return (a.soldout ? 1 : 0) - (b.soldout ? 1 : 0); });
  return arr;
}
function tagHTML(p) {
  if (p.old > p.price && p.price > 0) return '<span class="tag sale">−' + Math.round((1 - p.price / p.old) * 100) + '%</span>';
  if (p.badge) return '<span class="tag hot">' + esc(p.badge) + '</span>';
  return '';
}
function priceHTML(p) {
  if (!p.price) return '<span class="ask">Цена по запросу</span>';
  return '<b>' + money(p.price) + '</b>' + (p.old > p.price ? '<s>' + money(p.old) + '</s>' : '');
}
function cardHTML(p) {
  var c0 = p.colors[0], a = firstImg(p), b = c0 && c0.imgs[1] ? c0.imgs[1] : '', n = imgCount(p);
  var named = p.colors.filter(function (c) { return c.name; });
  return '<article class="card rv" data-id="' + esc(p.id) + '" tabindex="0" role="button" aria-label="' + esc(p.name) + '">' +
    '<div class="ph">' + (a ? '<img loading="lazy" src="' + esc(Store.img(a)) + '" alt="' + esc(p.name) + '">' : '<span class="noimg">' + ICON('star', '') + '</span>') + (b ? '<img class="b" loading="lazy" src="' + esc(Store.img(b)) + '" alt="">' : '') +
      tagHTML(p) + (n > 1 ? '<span class="cnt">' + ICON('cam', '') + n + '</span>' : '') + (p.soldout ? '<span class="so">Нет в наличии</span>' : '') + '</div>' +
    '<div class="cb">' + (p.own ? '<span class="own">Своё производство</span>' : '') + '<h3>' + esc(p.name) + '</h3>' +
      (named.length ? '<div class="dots">' + named.slice(0, 5).map(function (c) { return '<i style="--c:' + esc(c.hex) + '" title="' + esc(c.name) + '"></i>'; }).join('') + (named.length > 1 ? '<small>' + named.length + ' цв.</small>' : '<small>' + esc(named[0].name) + '</small>') + '</div>' : '') +
      '<div class="pr">' + priceHTML(p) + '</div></div></article>';
}
function paintGrid() {
  var arr = list();
  var ask = fsize && !q ? 'Здравствуйте! Ищу размер ' + fsize + (sizeAge(fsize) ? ' (' + sizeAge(fsize) + ')' : '') + '.' : 'Здравствуйте! Ищу: ' + q;
  var link = '<a class="wa-link" style="color:var(--cara);font-weight:700;text-decoration:underline" target="_blank" rel="noopener" href="' + esc(waUrl(ask)) + '">спросите в WhatsApp</a>';
  $('#grid').innerHTML = arr.length ? arr.map(cardHTML).join('') :
    (fsize ? '<div class="empty"><b>В размере ' + esc(fsize) + ' пока ничего нет</b>Выберите другой размер или ' + link + '</div>' :
      '<div class="empty"><b>Ничего не нашлось</b>' + (q ? 'Попробуйте другое слово или ' : 'Загляните позже или ') + link + '</div>');
  paintSizeBar(arr.length);
  observe();
}
$('#cats').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; cat = b.dataset.cat; paintCats(); paintGrid(); });
$('#szf').addEventListener('click', function (e) { var b = e.target.closest('[data-fs]'); if (b) setSize(b.dataset.fs, false); });
$('#szbar').addEventListener('click', function (e) { if (e.target.closest('[data-fs]')) setSize('', false); });
$('#sizeGrid').addEventListener('click', function (e) { var b = e.target.closest('.sz'); if (b) setSize(b.dataset.size, true); });
$('#sort').addEventListener('change', function () { sort = this.value; paintGrid(); });
var qT = null;
$('#q').addEventListener('input', function () { q = this.value; $('#qx').hidden = !q; clearTimeout(qT); qT = setTimeout(paintGrid, 120); });
$('#qx').addEventListener('click', function () { q = ''; $('#q').value = ''; this.hidden = true; paintGrid(); $('#q').focus(); });
$('#grid').addEventListener('click', function (e) { var c = e.target.closest('.card'); if (c) openProduct(c.dataset.id); });
$('#grid').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); openProduct(e.target.dataset.id); } });

/* ===== шторка ===== */
var ov = $('#ov'), body = $('#shB'), lastFocus = null, mode = '';
function openSheet(m, wide) {
  mode = m; ov.classList.toggle('wide', !!wide);
  if (!ov.classList.contains('open')) { lastFocus = document.activeElement; ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  $('.sheet', ov).scrollTop = 0;
  setTimeout(function () { $('#shX').focus({ preventScroll: true }); }, 30);
}
function closeSheet() { ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; mode = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); if (location.hash.indexOf('#p=') === 0) history.replaceState(null, '', location.pathname + location.search); }
$('#shX').onclick = closeSheet;
ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if ($('#zm').classList.contains('open')) closeZoom(); else if (ov.classList.contains('open')) closeSheet(); }
  if (mode === 'p' && !$('#zm').classList.contains('open')) { if (e.key === 'ArrowRight') galGo(1); if (e.key === 'ArrowLeft') galGo(-1); }
});

/* ===== карточка товара ===== */
var P = null, ps = { ci: 0, size: null, qty: 1 };
function openProduct(id) {
  P = findP(id); if (!P) return;
  ps = { ci: 0, size: P.sizes.length === 1 ? P.sizes[0] : (fsize && hasSize(P, fsize) ? String(fsize) : null), qty: 1 };
  paintProduct(); openSheet('p', true);
  history.replaceState(null, '', '#p=' + encodeURIComponent(id));
}
function galImgs() { var c = P.colors[ps.ci]; var a = c && c.imgs.length ? c.imgs : []; if (!a.length) { var f = firstImg(P); if (f) a = [f]; } return a; }
function paintProduct() {
  var p = P, c = p.colors[ps.ci], imgs = galImgs(), named = p.colors.filter(function (x) { return x.name; }).length;
  var sold = p.soldout;
  body.innerHTML = '<div class="pv">' +
    '<div><div class="gal"><div class="gs" id="gs">' + imgs.map(function (im, i) { return '<img src="' + esc(Store.img(im)) + '" alt="' + esc(p.name + (c && c.name ? ', ' + c.name : '') + ' — фото ' + (i + 1)) + '"' + (i ? ' loading="lazy"' : '') + ' data-i="' + i + '">'; }).join('') + '</div>' +
      (imgs.length > 1 ? '<div class="gd" id="gd">' + imgs.map(function (_, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div><button class="gn p" data-g="-1" aria-label="Предыдущее фото">' + ICON('l') + '</button><button class="gn n" data-g="1" aria-label="Следующее фото">' + ICON('r') + '</button>' : '') +
      '</div>' + (imgs.length > 1 ? '<div class="thumbs" id="th">' + imgs.map(function (im, i) { return '<button data-t="' + i + '" aria-label="Фото ' + (i + 1) + '" aria-current="' + (i === 0) + '"><img src="' + esc(Store.img(im)) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') + '</div>' +
    '<div class="pi">' +
      '<div>' + (p.own ? '<span class="own" style="margin-bottom:6px">Своё производство · ' + esc(catName(p.cat)) + '</span>' : '<span class="own" style="margin-bottom:6px">' + esc(catName(p.cat)) + '</span>') + '<h3 id="shT">' + esc(p.name) + '</h3></div>' +
      '<div class="pr" style="padding:0">' + priceHTML(p) + (p.badge && !(p.old > p.price && p.price) ? ' <span class="tag hot" style="position:static">' + esc(p.badge) + '</span>' : '') + '</div>' +
      (p.desc ? '<p class="ds">' + esc(p.desc) + '</p>' : '') +
      (named ? '<div><div class="lab">Цвет <b>' + esc(c.name) + '</b></div><div class="sws">' + p.colors.map(function (x, i) { return x.name ? '<button data-c="' + i + '" aria-pressed="' + (i === ps.ci) + '"><i style="--c:' + esc(x.hex) + '"></i>' + esc(x.name) + '</button>' : ''; }).join('') + '</div></div>' : '') +
      (p.sizes.length ? '<div id="szw"><div class="lab">Размер' + ((S.sizeGuide || []).length ? ' <a href="#sizes" data-close>Таблица размеров</a>' : '') + '</div><div class="szs" id="szs">' + p.sizes.map(function (s) { var a = sizeAge(s); return '<button data-s="' + esc(s) + '" aria-pressed="' + (s === ps.size) + '">' + esc(s) + (a ? '<small>' + esc(a) + '</small>' : '') + '</button>'; }).join('') + '</div><span class="err">Выберите размер</span></div>' : '') +
      (sold ? '<div class="pmeta"><div><b style="color:var(--ink)">Сейчас нет в наличии.</b></div><div>Напишите нам — сообщим, когда появится.</div></div>' :
        '<div class="buy"><span class="qty"><button type="button" data-q="-1" aria-label="Меньше">−</button><b id="pq">' + ps.qty + '</b><button type="button" data-q="1" aria-label="Больше">+</button></span><button class="btn dk" id="add" type="button">' + ICON('bag') + 'В корзину</button></div>') +
      '<a class="wq" id="ask" href="#" target="_blank" rel="noopener">' + ICON('wa', '') + (sold ? 'Узнать о поступлении' : (p.price ? 'Спросить в WhatsApp' : 'Узнать цену в WhatsApp')) + '</a>' +
      '<div class="pmeta"><div>' + ICON('truck') + 'Доставка по Казахстану, СНГ и миру</div><div>' + ICON('ruler') + 'Поможем подобрать размер по росту ребёнка</div></div>' +
    '</div></div>';
  updAsk(); bindGal();
}
function updAsk() {
  var c = P.colors[ps.ci], t = 'Здравствуйте! Интересует: ' + P.name + (c && c.name ? ', цвет: ' + c.name : '') + (ps.size ? ', размер: ' + ps.size : '') + (P.price ? ' (' + money(P.price) + ')' : '') + '.';
  var a = $('#ask'); if (a) a.href = waUrl(t);
}
var gi = 0;
function bindGal() {
  gi = 0; var gs = $('#gs'); if (!gs) return;
  gs.addEventListener('scroll', function () { var i = Math.round(gs.scrollLeft / gs.clientWidth); if (i !== gi) { gi = i; galMark(); } }, { passive: true });
}
function galMark() { $$('#gd i').forEach(function (d, k) { d.classList.toggle('on', k === gi); }); $$('#th button').forEach(function (b, k) { b.setAttribute('aria-current', k === gi); }); var t = $('#th button[aria-current="true"]'); if (t) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
function galTo(i) { var gs = $('#gs'); if (!gs) return; var n = gs.children.length; gi = (i + n) % n; gs.scrollTo({ left: gi * gs.clientWidth, behavior: 'smooth' }); galMark(); }
function galGo(d) { galTo(gi + d); }
body.addEventListener('click', function (e) {
  var t = e.target;
  if (t.closest('[data-close]')) { closeSheet(); return; }
  if (mode === 'p') {
    var b;
    if ((b = t.closest('[data-g]'))) return galGo(+b.dataset.g);
    if ((b = t.closest('[data-t]'))) return galTo(+b.dataset.t);
    if ((b = t.closest('[data-c]'))) { ps.ci = +b.dataset.c; paintProduct(); return; }
    if ((b = t.closest('[data-s]'))) { ps.size = ps.size === b.dataset.s ? null : b.dataset.s; $$('#szs button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.s === ps.size); }); $('#szw .szs').classList.remove('bad'); updAsk(); return; }
    if ((b = t.closest('[data-q]'))) { ps.qty = Math.max(1, Math.min(20, ps.qty + (+b.dataset.q))); $('#pq').textContent = ps.qty; return; }
    if (t.closest('#add')) return addToCart();
    if (t.tagName === 'IMG' && t.closest('#gs')) return openZoom(t.src);
  }
  if (mode === 'cart') cartClick(e);
});

/* ===== просмотр фото на весь экран ===== */
function openZoom(src) { $('#zmI').src = src; $('#zm').classList.add('open'); }
function closeZoom() { $('#zm').classList.remove('open'); }
$('#zm').addEventListener('click', function (e) { if (e.target.id !== 'zmI') closeZoom(); });

/* ===== корзина ===== */
function keyOf(id, ci, s) { return id + '|' + ci + '|' + (s || ''); }
function loadCart() {
  CART = (ls('lk_cart') || []).filter(function (x) { var p = findP(x.id); return p && p.on && !p.soldout && p.colors[x.ci] && x.q > 0; })
    .map(function (x) { return { id: x.id, ci: x.ci, s: x.s || '', q: Math.min(20, x.q) }; });
}
function saveCart() { ls('lk_cart', CART); paintCartBar(); }
function cartCount() { return CART.reduce(function (s, x) { return s + x.q; }, 0); }
function cartSum() { return CART.reduce(function (s, x) { var p = findP(x.id); return s + (p ? p.price * x.q : 0); }, 0); }
function cartTBD() { return CART.some(function (x) { var p = findP(x.id); return p && !p.price; }); }
function plural(n, a, b, c) { var m = n % 10, h = n % 100; return n + ' ' + (m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c); }
function paintCartBar() {
  var n = cartCount();
  $('#cartN').hidden = !n; $('#cartN').textContent = n;
  $('#cbar').hidden = !n || mode === 'cart'; document.body.classList.toggle('hc', !!n);
  $('#cbT').innerHTML = esc(plural(n, 'товар', 'товара', 'товаров')) + '<small>' + (cartSum() ? money(cartSum()) + (cartTBD() ? ' + уточним' : '') : 'цену уточним') + '</small>';
}
function addToCart() {
  if (P.sizes.length && !ps.size) {
    var w = $('#szs'); w.classList.remove('bad'); void w.offsetWidth; w.classList.add('bad'); w.scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
  }
  var k = keyOf(P.id, ps.ci, ps.size), f = null;
  CART.forEach(function (x) { if (keyOf(x.id, x.ci, x.s) === k) f = x; });
  if (f) f.q = Math.min(20, f.q + ps.qty); else CART.push({ id: P.id, ci: ps.ci, s: ps.size || '', q: ps.qty });
  saveCart(); closeSheet(); toast('Добавлено в корзину ✓');
}
function lineName(x) { var p = findP(x.id), c = p.colors[x.ci]; return p.name + ((c && c.name) || x.s ? ' (' + [c && c.name, x.s ? 'размер ' + x.s : ''].filter(Boolean).join(', ') + ')' : ''); }
var ckKeep = null;
function openCart() { ckKeep = null; paintCart(); openSheet('cart'); paintCartBar(); }
function paintCart() {
  var f = $('#ckf'); if (f) ckKeep = { name: f.name.value, phone: f.phone.value, city: f.city.value, del: f.del.value, note: f.note.value };
  if (!CART.length) {
    body.innerHTML = '<div class="sp"><h3 class="t" id="shT">Корзина пуста</h3><p class="sub" style="margin:0 0 18px">Откройте каталог и добавьте вещи — выберите цвет и размер.</p><a class="btn dk" style="width:100%" href="#catalog" data-close>Перейти в каталог</a></div>';
    return;
  }
  var dr = ckKeep || ls('lk_client') || {}, del = S.delivery || [];
  body.innerHTML = '<div class="sp"><h3 class="t" id="shT">Ваш заказ</h3>' +
    '<div class="cl">' + CART.map(function (x, i) {
      var p = findP(x.id), c = p.colors[x.ci];
      return '<div class="ci"><img src="' + esc(Store.img(firstImg(p, x.ci))) + '" alt=""><div class="m"><b>' + esc(p.name) + '</b><small>' + esc([c && c.name, x.s ? 'размер ' + x.s : ''].filter(Boolean).join(' · ') || '—') + '</small><div class="p">' + (p.price ? money(p.price * x.q) : '<span style="color:var(--cara)">цена по запросу</span>') + '</div></div>' +
        '<div class="r"><span class="qty"><button type="button" data-cq="-1" data-i="' + i + '" aria-label="Меньше">−</button><b>' + x.q + '</b><button type="button" data-cq="1" data-i="' + i + '" aria-label="Больше">+</button></span><button class="rm" type="button" data-rm="' + i + '">Удалить</button></div></div>';
    }).join('') + '</div>' +
    '<div class="tot"><span>Итого</span><b>' + (cartSum() ? money(cartSum()) : '—') + '</b></div>' +
    (cartTBD() ? '<p class="tbd">Для товаров «по запросу» цену уточним в WhatsApp.</p>' : '') +
    '<form class="form" id="ckf" novalidate>' +
      '<label class="fld" id="c-name">Имя<input name="name" autocomplete="given-name" maxlength="40" placeholder="Как к вам обращаться"><span class="err">Напишите имя</span></label>' +
      '<label class="fld" id="c-phone">Телефон / WhatsApp<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 7__ ___ __ __"><span class="err">Нужен номер из 11 цифр</span></label>' +
      '<div class="two"><label class="fld">Город<input name="city" autocomplete="address-level2" maxlength="40" placeholder="Например: Астана"></label>' +
      '<label class="fld">Доставка<select name="del">' + del.map(function (d) { return '<option>' + esc(d) + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="fld">Комментарий<textarea name="note" rows="2" maxlength="300" placeholder="Адрес, рост ребёнка или пожелания"></textarea></label>' +
      '<button class="btn wa" type="button" data-send="wa">' + ICON('wa') + 'Оформить в WhatsApp</button>' +
      '<button class="btn ol" type="button" data-send="site">Оформить на сайте</button>' +
      '<p class="note">' + esc(S.orderNote || 'После заказа мы напишем вам, уточним размер и доставку.') + '</p>' +
    '</form></div>';
  f = $('#ckf');
  if (dr.name) f.name.value = dr.name; if (dr.phone) f.phone.value = dr.phone; if (dr.city) f.city.value = dr.city; if (dr.note) f.note.value = dr.note;
  if (dr.del && del.indexOf(dr.del) >= 0) f.del.value = dr.del;
}
function cartClick(e) {
  var t = e.target.closest('button'); if (!t) return;
  if (t.dataset.cq) { var x = CART[+t.dataset.i]; x.q = Math.max(0, Math.min(20, x.q + (+t.dataset.cq))); if (!x.q) CART.splice(+t.dataset.i, 1); saveCart(); paintCart(); return; }
  if (t.dataset.rm) { CART.splice(+t.dataset.rm, 1); saveCart(); paintCart(); return; }
  if (t.dataset.send) sendOrder(t.dataset.send, t);
}
function digits(v) { return String(v || '').replace(/\D/g, ''); }
function normPhone(v) { var d = digits(v); if (d.length === 10) d = '7' + d; if (d.length === 11 && d.charAt(0) === '8') d = '7' + d.slice(1); return d; }
function phonePretty(v) { var d = normPhone(v); if (d.charAt(0) === '8') d = '7' + d.slice(1); if (d && d.charAt(0) !== '7') d = '7' + d; d = d.slice(0, 11); var o = '+7'; if (d.length > 1) o += ' ' + d.slice(1, 4); if (d.length > 4) o += ' ' + d.slice(4, 7); if (d.length > 7) o += ' ' + d.slice(7, 9); if (d.length > 9) o += ' ' + d.slice(9, 11); return o; }
document.addEventListener('focusout', function (e) { if (e.target.name === 'phone' && e.target.closest('#ckf') && digits(e.target.value).length >= 10) e.target.value = phonePretty(e.target.value); });
function sendOrder(via, btn) {
  var f = $('#ckf'), ok = true, ph = normPhone(f.phone.value);
  [['name', !f.name.value.trim()], ['phone', ph.length !== 11]].forEach(function (x) { var l = $('#c-' + x[0]); l.classList.toggle('bad', x[1]); if (x[1] && ok) { f[x[0]].focus(); ok = false; } });
  if (!ok) return;
  var del = f.del.value, city = f.city.value.trim(), note = f.note.value.trim();
  var o = {
    kind: 'order', via: via === 'wa' ? 'whatsapp' : 'site', name: f.name.value.trim(), phone: phonePretty(ph), city: city, delivery: del, note: note,
    comment: ['Доставка: ' + del + (city ? ', ' + city : ''), note].filter(Boolean).join(' · '),
    items: CART.map(function (x) { var p = findP(x.id); return { name: lineName(x), qty: x.q, price: p.price, id: x.id }; }),
    total: cartSum(), tbd: cartTBD()
  };
  ls('lk_client', { name: o.name, phone: o.phone, city: city, del: del });
  if (via === 'wa') {
    var L = ['Здравствуйте! Хочу оформить заказ в ' + (S.name || 'ALISA KIDS') + ':', ''];
    o.items.forEach(function (x, i) { L.push((i + 1) + ') ' + x.name + ' × ' + x.qty + (x.price ? ' — ' + money(x.price * x.qty) : ' — цена по запросу')); });
    L.push('', 'Итого: ' + (o.total ? money(o.total) : '—') + (o.tbd ? ' (+ уточнить цену)' : ''), '', 'Имя: ' + o.name, 'Телефон: ' + o.phone, 'Доставка: ' + del + (city ? ', г. ' + city : ''));
    if (note) L.push('Комментарий: ' + note);
    var sent = false;
    try { sent = navigator.sendBeacon(Store.api + '/order?site=' + Store.site, new Blob([JSON.stringify(o)], { type: 'text/plain' })); } catch (e) { }
    if (!sent) Store.createOrder(o);
    var url = waUrl(L.join('\n')), w = window.open(url, '_blank'); if (!w) location.href = url;
    clearCart(); showDone(url); return;
  }
  btn.disabled = true; btn.textContent = 'Отправляю…';
  Store.createOrder(o).then(function (r) {
    if (!r) { btn.disabled = false; btn.textContent = 'Оформить на сайте'; toast('Нет связи. Оформите через WhatsApp'); return; }
    clearCart(); showDone('');
  });
}
function clearCart() { CART = []; saveCart(); }
function showDone(url) {
  body.innerHTML = '<div class="sp"><div class="done"><div class="ok">✓</div><h3 id="shT">' + (url ? 'Почти готово!' : 'Заказ принят!') + '</h3><p>' +
    (url ? 'Мы открыли WhatsApp с вашим заказом — нажмите «Отправить». Если чат не открылся, нажмите кнопку ниже.' : 'Спасибо! Мы скоро напишем вам в WhatsApp, чтобы подтвердить заказ.') + '</p>' +
    (url ? '<a class="btn wa" style="width:100%;margin-bottom:10px" href="' + esc(url) + '" target="_blank" rel="noopener">' + ICON('wa') + 'Открыть WhatsApp</a>' : '') +
    '<button class="btn ol" style="width:100%" type="button" data-close>Вернуться в магазин</button></div></div>';
  mode = 'done';
}
$('#openCart').onclick = openCart; $('#cbGo').onclick = openCart;

/* ===== настройки ===== */
function openSettings() {
  body.innerHTML = '<div class="sp"><h3 class="t" id="shT">Настройки</h3>' +
    '<div class="srow"><div><b>Тёмная тема</b><small>Удобнее смотреть вечером</small></div><button class="tg" id="swDark" role="switch" aria-checked="false" aria-label="Тёмная тема"></button></div>' +
    '<div class="srow"><div><b>Крупный текст</b><small>Увеличить размер шрифта</small></div><button class="tg" id="swBig" role="switch" aria-checked="false" aria-label="Крупный текст"></button></div>' +
    '<div class="promo"><h3>Хотите похожий сайт для бизнеса?</h3><p>Сделаю такой же сайт для вашего дела — с каталогом, корзиной и админкой, под ключ.</p>' +
    '<a href="' + esc(waUrl('Здравствуйте! Увидел сайт ' + (S.name || 'ALISA KIDS') + ' — хочу такой же сайт для своего бизнеса.', DEV_WA)) + '" target="_blank" rel="noopener">' + ICON('wa', '') + 'Написать: ' + DEV_PRETTY + '</a></div>' +
    '<a class="own-l" href="admin.html" rel="nofollow">Вход для владельца магазина</a></div>';
  applyPrefs(); openSheet('set');
  $('#swDark').onclick = function () { ls('lk_dark', ls('lk_dark') === 1 ? 0 : 1); applyPrefs(); };
  $('#swBig').onclick = function () { ls('lk_big', ls('lk_big') === 1 ? 0 : 1); applyPrefs(); };
}
$('#openSet').onclick = openSettings;

/* ===== появление при прокрутке ===== */
var io = null;
function observe() {
  if (!('IntersectionObserver' in window)) { $$('.rv').forEach(function (el) { el.classList.add('in'); }); return; }
  io = io || new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: .06, rootMargin: '0px 0px -30px 0px' });
  $$('.rv:not(.in)').forEach(function (el) { io.observe(el); });
}

/* ===== старт ===== */
function start(d) {
  D = d; paintPage(); paintSizes(); paintCats(); paintGrid(); loadCart(); paintCartBar();
  var m = /^#p=(.+)$/.exec(location.hash); if (m && findP(decodeURIComponent(m[1]))) openProduct(decodeURIComponent(m[1]));
}
Store.load().then(start).catch(function () {
  $('#grid').innerHTML = '<div class="empty"><b>Каталог не загрузился</b>Проверьте интернет и обновите страницу или <a class="wa-link" href="https://wa.me/77026288740" style="color:var(--cara);font-weight:700;text-decoration:underline">напишите нам в WhatsApp</a>.</div>';
});
})();
