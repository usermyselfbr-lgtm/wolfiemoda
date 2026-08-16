/* ==========================================================================
   WOLFIE — comportamento da loja
   Vanilla JS, sem dependências. Estado do carrinho em localStorage.
   ========================================================================== */
(() => {
'use strict';

/* ---------- catálogo ---------- */
const CATALOG = {
  'maio-dunas':        {name:'MAIÔ DUNAS',            varejo:199.90, atacado:139.93, ph:'g-sand',   cor:'Areia'},
  'biquini-fita':      {name:'BIQUÍNI FITA ATACAMA',  varejo:179.90, atacado:125.93, ph:'g-terra',  cor:'Terracota'},
  'biquini-pedras':    {name:'BIQUÍNI PEDRAS ATACAMA',varejo:299.90, atacado:209.93, ph:'g-noir',   cor:'Preto'},
  'maio-laguna':       {name:'MAIÔ LAGUNA',           varejo:219.90, atacado:153.93, ph:'g-rose',   cor:'Rosé'},
  'biquini-laguna':    {name:'BIQUÍNI LAGUNA',        varejo:219.90, atacado:153.93, ph:'g-sand',   cor:'Areia'},
  'biquini-dunas':     {name:'BIQUÍNI DUNAS',         varejo:219.90, atacado:153.93, ph:'g-peach',  cor:'Pêssego'},
  'biquini-deserto':   {name:'BIQUÍNI DESERTO',       varejo:99.90,  de:199.90, atacado:69.93, ph:'g-peach', cor:'Coral'},
  'biquini-aurora':    {name:'BIQUÍNI AURORA',        varejo:79.90,  de:159.90, atacado:55.93, ph:'g-sand',  cor:'Areia'},
  'biquini-lumina':    {name:'BIQUÍNI LUMINA',        varejo:99.90,  de:199.90, atacado:69.93, ph:'g-rose',  cor:'Rosé'},
  'bermuda-sal':       {name:'BERMUDA SAL',           varejo:49.90,  de:139.90, atacado:34.93, ph:'g-stone', cor:'Off-white'},
  'bone-lifestyle':    {name:'BONÉ LIFESTYLE',        varejo:99.90,  atacado:69.93, ph:'g-noir',  cor:'Preto'},
  'viseira-coco':      {name:'VISEIRA ÁGUA DE COCO',  varejo:59.90,  atacado:41.93, ph:'g-noir',  cor:'Preto'},
  'vestido-selvagem':  {name:'VESTIDO SELVAGEM',      varejo:159.90, atacado:111.93, ph:'g-terra', cor:'Marrom'},
  'macaquinho-seamless':{name:'MACAQUINHO SEAMLESS',  varejo:189.90, atacado:132.93, ph:'g-blue',  cor:'Azul'},
  'top-seamless':      {name:'TOP SEAMLESS',          varejo:129.90, atacado:90.93,  ph:'g-blue',  cor:'Azul'},
  'legging-seamless':  {name:'LEGGING SEAMLESS',      varejo:199.90, atacado:139.93, ph:'g-blue',  cor:'Azul'}
};

const META_ATACADO = 12;          // peças variadas para liberar preço de fábrica
const FRETE_GRATIS = 399.90;      // varejo
const CUPOM = {code:'WOLFIE10', off:.10};

/* ---------- helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const pix = n => n * .95;   // 5% no PIX

/* ---------- carrinho (localStorage) ---------- */
const Cart = {
  read(){ try{ return JSON.parse(localStorage.getItem('wolfie.cart')) || []; }catch{ return []; } },
  write(items){ localStorage.setItem('wolfie.cart', JSON.stringify(items)); this.paint(); },
  add(id, size='M', qty=1){
    const items = this.read();
    const hit = items.find(i => i.id === id && i.size === size);
    hit ? hit.qty += qty : items.push({id, size, qty});
    this.write(items);
    Toast.show('Adicionado à sacola', CATALOG[id].name + ' • ' + size);
  },
  remove(idx){ const i = this.read(); i.splice(idx,1); this.write(i); },
  pieces(){ return this.read().reduce((s,i) => s + i.qty, 0); },
  total(){
    const wholesale = this.pieces() >= META_ATACADO;
    return this.read().reduce((s,i) => {
      const p = CATALOG[i.id];
      return s + (wholesale ? p.atacado : p.varejo) * i.qty;
    }, 0);
  },
  paint(){
    const n = this.pieces();
    $$('[data-cart-count]').forEach(el => {
      if(el.textContent !== String(n)){
        el.textContent = n;
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      }
    });
    if (typeof renderCart === 'function') renderCart();
  }
};

/* ---------- toast ---------- */
const Toast = {
  el:null,
  show(title, msg){
    if(!this.el){
      this.el = document.createElement('div');
      this.el.className = 'toast';
      this.el.innerHTML = `<div class="toast__ic" data-ic="bell"></div><div><h6></h6><p></p></div>`;
      document.body.appendChild(this.el);
      initIcons(this.el);
    }
    $('h6', this.el).textContent = title;
    $('p',  this.el).textContent = msg;
    this.el.classList.add('is-on');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.classList.remove('is-on'), 3600);
  }
};

/* ---------- 0. ícones de traço (substituem Ionicons/FontAwesome do original) ---------- */
const S = (p, extra='') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
const ICONS = {
  shield: S('<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>'),
  truck:  S('<path d="M2 7h11v10H2zM13 10h4l3 3v4h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
  refresh:S('<path d="M20 12a8 8 0 11-2.3-5.6M20 3v5h-5"/>'),
  chat:   S('<path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z"/>'),
  heart:  S('<path d="M12 20s-7-4.4-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.6 12 20 12 20z"/>'),
  card:   S('<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>'),
  ticket: S('<path d="M20 8V6H4v2a2.5 2.5 0 010 5v3h16v-3a2.5 2.5 0 010-5z"/><path d="M14 6v10" stroke-dasharray="2 2"/>'),
  cart:   S('<path d="M4 5h2l2 10h10l2-7H7"/><circle cx="10" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'),
  bag:    S('<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>'),
  box:    S('<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8"/>'),
  back:   S('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>'),
  zoom:   S('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M8.5 11h5M11 8.5v5"/>'),
  hanger: S('<path d="M12 8a2.4 2.4 0 112.4-2.4"/><path d="M12 8v2l8 5.5c1 .7.5 2.5-.8 2.5H4.8c-1.3 0-1.8-1.8-.8-2.5L12 10"/>'),
  ruler:  S('<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M7 8v3M12 8v4M17 8v3"/>'),
  lock:   S('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>'),
  mail:   S('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2.5 7l9.5 6 9.5-6"/>'),
  store:  S('<path d="M4 10v10h16V10"/><path d="M3 4h18l1 5a3 3 0 01-5.5 1.7A3 3 0 0112 10a3 3 0 01-4.5.7A3 3 0 012 9l1-5z"/>'),
  check:  S('<path d="M4 12.5l5 5L20 6"/>'),
  checkc: S('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.6"/>'),
  book:   S('<path d="M4 4h7a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H4z"/><path d="M20 4h-3a3 3 0 00-3 3v13a2.5 2.5 0 012.5-2.5H20z"/>'),
  info:   S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  percent:S('<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>'),
  pix:    S('<path d="M12 3l9 9-9 9-9-9 9-9z"/>'),
  wpp:    S('<path d="M20 12a8 8 0 01-11.9 7L3 20l1.1-4.8A8 8 0 1120 12z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.9-1.1.8a5 5 0 01-2.4-2.4l.8-1.1L10.5 9c-.5 0-1.5.1-1.5.5z" fill="currentColor" stroke="none"/>', 'stroke-width="1.6"'),
  trash:  S('<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>'),
  bell:   S('<path d="M6 9a6 6 0 1112 0v5l2 3H4l2-3V9z"/><path d="M10 20a2 2 0 004 0"/>'),
  user:   S('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>'),
  /* marcas — desenhadas em path, sem CDN de terceiros */
  ig:     S('<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17" cy="7" r="1.15" fill="currentColor" stroke="none"/>', 'stroke-width="1.9"'),
  fb:     S('<path d="M13.6 21.5v-8.2h2.8l.42-3.2h-3.22V8.05c0-.93.26-1.56 1.6-1.56h1.72V3.63c-.3-.04-1.32-.13-2.5-.13-2.48 0-4.18 1.51-4.18 4.29v2.4H7.4v3.2h2.84v8.2z" fill="currentColor" stroke="none"/>', 'stroke="none"'),
  tk:     S('<path d="M14.6 2.5h2.55a5.05 5.05 0 004.35 4.4v2.62a7.6 7.6 0 01-4.3-1.42v6.55a5.72 5.72 0 11-5.72-5.72c.3 0 .6.03.9.08v2.75a3.03 3.03 0 101.92 2.9z" fill="currentColor" stroke="none"/>', 'stroke="none"'),
  building:S('<path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16"/><path d="M15 10h4a1 1 0 011 1v10"/><path d="M7 8h2M7 12h2M7 16h2M12 8h.01M12 12h.01M12 16h.01"/>')
};
function initIcons(root=document){
  [...root.querySelectorAll('[data-ic]')].forEach(el => {
    if(!el.firstElementChild) el.innerHTML = ICONS[el.dataset.ic] || '';
  });
}

/* ---------- 1. menu mobile ---------- */
function initDrawer(){
  const d = $('#drawer'), s = $('#scrim');
  if(!d) return;
  const open  = () => { d.classList.add('is-on'); s.classList.add('is-on'); };
  const close = () => { d.classList.remove('is-on'); s.classList.remove('is-on'); };
  $$('[data-open-menu]').forEach(b => b.addEventListener('click', open));
  $$('[data-close-menu]').forEach(b => b.addEventListener('click', close));
  s.addEventListener('click', close);
}

/* ---------- 2. slideshow do hero ---------- */
function initHero(){
  const slides = $$('.hero__slide');
  if(slides.length < 2) return;
  const dots = $('.hero__dots');
  let i = 0, timer;

  slides.forEach((_, k) => {
    const b = document.createElement('b');
    if(!k) b.className = 'is-on';
    b.addEventListener('click', () => go(k));
    dots.appendChild(b);
  });

  const go = k => {
    slides[i].classList.remove('is-on');
    dots.children[i].classList.remove('is-on');
    i = (k + slides.length) % slides.length;
    slides[i].classList.add('is-on');
    dots.children[i].classList.add('is-on');
    restart();
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(i+1), 6000); };

  $('.hero__nav.prev').addEventListener('click', () => go(i-1));
  $('.hero__nav.next').addEventListener('click', () => go(i+1));
  restart();
}

/* ---------- 3. galeria + lente de zoom real (PDP) ---------- */
const ZOOM = 2.4;
function initGallery(){
  const stage = $('.gal__stage');
  if(!stage) return;
  const lens = $('.lens');
  const main = $('.gal__stage .ph');
  lens.innerHTML = '<div class="ph grain"></div>';
  const inner = $('.ph', lens);

  const syncLens = () => { inner.className = main.className.replace('hero__bg',''); };
  syncLens();

  $$('.gal__thumbs .ph').forEach(t => t.addEventListener('click', () => {
    $$('.gal__thumbs .ph').forEach(x => x.classList.remove('is-on'));
    t.classList.add('is-on');
    main.className = 'ph grain shine ' + [...t.classList].find(c => c.startsWith('g-'));
    syncLens();
  }));

  stage.addEventListener('mousemove', e => {
    const r = stage.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const lw = lens.offsetWidth / 2;
    // move a lupa e reposiciona a imagem ampliada para o ponto sob o cursor
    lens.style.left = (x - lw) + 'px';
    lens.style.top  = (y - lw) + 'px';
    inner.style.width  = r.width  * ZOOM + 'px';
    inner.style.height = r.height * ZOOM + 'px';
    inner.style.left   = -(x * ZOOM - lw) + 'px';
    inner.style.top    = -(y * ZOOM - lw) + 'px';
    lens.classList.add('is-on');
  });
  stage.addEventListener('mouseleave', () => lens.classList.remove('is-on'));
}

/* ---------- 3b. atmosfera: header, progresso, reveal, 2ª foto ---------- */
const ALT_PH = ['g-noir','g-sand','g-terra','g-stone','g-rose','g-olive','g-blue','g-peach','g-lagoon'];

function initAtmosphere(){
  /* header em vidro + barra de progresso de leitura */
  const header = $('.header');
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  const onScroll = () => {
    const y = scrollY;
    header?.classList.toggle('is-stuck', y > 24);
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = h > 0 ? (y / h * 100) + '%' : '0';
  };
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* brilho diagonal + segunda foto nos cards */
  $$('.card__media .ph, .duo__card .ph, .fitness__hero .ph').forEach(p => p.classList.add('shine'));
  /* 2ª foto = mesmo produto em outro ângulo (aqui: mesma paleta espelhada).
     Com fotos reais, troque por <img> e o crossfade continua igual. */
  $$('.card__media').forEach(m => {
    if($('.ph--alt', m)) return;
    const base = $('.ph', m);
    if(!base) return;
    const el = document.createElement('div');
    el.className = `ph grain ph--alt ${[...base.classList].find(c => c.startsWith('g-')) || ''}`;
    base.after(el);
  });

  /* reveal no scroll com stagger */
  $$('main > section, .wrap > section, section, .duo, .circles, .fitness, .perks, .footer__cols, .pdp, .acc, .cart')
    .forEach(el => el.classList.add('reveal'));
  $$('.grid, .circles, .duo, .footer__cols').forEach(el => el.classList.add('stagger'));

  const showAll = () => $$('.reveal, .stagger').forEach(el => el.classList.add('is-in'));

  if(!('IntersectionObserver' in window)){ showAll(); return; }   // fallback

  /* rootMargin generoso: revela um pouco antes de entrar na tela e sobrevive a scroll rápido */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(e.isIntersecting || e.intersectionRatio > 0){ e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), {threshold:0, rootMargin:'220px 0px 220px'});
  $$('.reveal, .stagger').forEach(el => io.observe(el));

  /* o que já está na primeira dobra aparece de imediato */
  requestAnimationFrame(() => $$('.reveal, .stagger').forEach(el => {
    if(el.getBoundingClientRect().top < innerHeight * 1.1) el.classList.add('is-in');
  }));

  /* rede de segurança: ninguém fica invisível por bug de observer, print ou captura */
  addEventListener('beforeprint', showAll);
  setTimeout(() => $$('.reveal:not(.is-in), .stagger:not(.is-in)').forEach(el => {
    if(el.getBoundingClientRect().top < innerHeight * 3) el.classList.add('is-in');
  }), 2500);
}

/* ---------- 4. seletores de tamanho/cor ---------- */
function initOptions(){
  $$('.opt__row').forEach(row => {
    row.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if(!chip || chip.classList.contains('is-off')) return;
      $$('.chip', row).forEach(c => c.classList.remove('is-on'));
      chip.classList.add('is-on');
      const out = $(row.dataset.out);
      if(out) out.textContent = chip.dataset.value || chip.textContent.trim();
    });
  });
}

/* ---------- 5. tabela de medidas (padrão Sizebay) ---------- */
const MEASURES = {
  P:{Busto:'90 – 94 cm',  Cintura:'68 – 72 cm', Quadril:'96 – 100 cm'},
  M:{Busto:'98 – 102 cm', Cintura:'76 – 80 cm', Quadril:'104 – 108 cm'},
  G:{Busto:'106 – 110 cm',Cintura:'84 – 88 cm', Quadril:'112 – 116 cm'}
};
function initSizes(){
  const box = $('#measures');
  if(!box) return;
  const paint = s => {
    box.innerHTML = Object.entries(MEASURES[s])
      .map(([k,v]) => `<div class="measure"><b>${k}</b><span>${v}</span></div>`).join('');
  };
  $$('.sizes-tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.sizes-tabs button').forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on');
    paint(b.textContent.trim());
  }));
  paint('P');
}

/* ---------- 6. acordeões ---------- */
function initAcc(){
  $$('.acc__more').forEach(btn => btn.addEventListener('click', () => {
    const body = btn.previousElementSibling;
    const open = body.classList.toggle('is-open');
    btn.innerHTML = (open ? '−' : '+') + ' <span>' + (open ? 'Ver menos' : 'Ver mais') + '</span>';
  }));
}

/* ---------- 7. modais ---------- */
function initModals(){
  $$('[data-modal]').forEach(b => b.addEventListener('click', () => {
    $('#' + b.dataset.modal)?.classList.add('is-on');
  }));
  $$('.ov').forEach(ov => ov.addEventListener('click', e => {
    if(e.target === ov || e.target.closest('[data-close]')) ov.classList.remove('is-on');
  }));
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') $$('.ov.is-on').forEach(o => o.classList.remove('is-on'));
  });
}

/* ---------- 8. simulador de frete ---------- */
function initCep(){
  $$('[data-cep]').forEach(box => {
    const input = $('input', box), out = $('.cep-out', box);
    $('button', box).addEventListener('click', () => {
      const cep = input.value.replace(/\D/g,'');
      if(cep.length < 8){ input.focus(); input.style.borderColor = 'var(--price)'; return; }
      input.style.borderColor = '';
      out.classList.add('is-on');
      out.innerHTML = `
        <div><span>Sedex ⚡ FULL</span><b>2 a 4 dias úteis — ${brl(24.90)}</b></div>
        <div><span>PAC — Correios</span><b>6 a 9 dias úteis — ${brl(12.40)}</b></div>
        <div><span>Retirar na loja física</span><b>Grátis — hoje</b></div>
        <div style="border:0;color:var(--green);font-weight:600">Frete grátis (PAC) em compras acima de ${brl(FRETE_GRATIS)}</div>`;
    });
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g,'').slice(0,8);
      input.value = v.length > 5 ? v.slice(0,5) + '-' + v.slice(5) : v;
    });
  });
}

/* ---------- 9. botões de compra ---------- */
function initBuy(){
  $$('[data-add]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const size = $('.opt__row [data-size].is-on')?.textContent.trim() || 'M';
    const qty  = parseInt($('#qty')?.value || 1, 10);
    Cart.add(b.dataset.add, size, qty);
  }));
  $$('[data-buy]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const size = $('.opt__row [data-size].is-on')?.textContent.trim() || 'M';
    const qty  = parseInt($('#qty')?.value || 1, 10);
    Cart.add(b.dataset.buy, size, qty);
    location.href = 'checkout.html';
  }));
  const q = $('#qty');
  if(q){
    $('#qty-dec')?.addEventListener('click', () => q.value = Math.max(1, +q.value - 1));
    $('#qty-inc')?.addEventListener('click', () => q.value = +q.value + 1);
  }
}

/* ---------- 10. carrinho: render + barra de atacado ---------- */
function renderCart(){
  const list = $('#cart-list');
  if(!list) return;
  const items = Cart.read();

  list.innerHTML = items.length ? items.map((it, idx) => {
    const p = CATALOG[it.id], wholesale = Cart.pieces() >= META_ATACADO;
    return `<div class="cart-item">
      <div class="ph grain ${p.ph}"></div>
      <div class="cart-item__i">
        <b>${p.name} – ${it.size} / ${p.cor}</b>
        <span>${it.qty}x</span>
        <em>${brl((wholesale ? p.atacado : p.varejo) * it.qty)}</em>
      </div>
      <button class="trash" data-rm="${idx}" aria-label="Remover" data-ic="trash"></button>
    </div>`;
  }).join('') : `<div class="cart-empty">Sua sacola está vazia.<br><a href="index.html" style="text-decoration:underline">Voltar às compras</a></div>`;

  initIcons(list);
  $$('[data-rm]', list).forEach(b => b.addEventListener('click', () => Cart.remove(+b.dataset.rm)));

  // barra de progresso do atacado
  const n = Cart.pieces(), falta = Math.max(0, META_ATACADO - n), pct = Math.min(100, n / META_ATACADO * 100);
  const w = $('#wholesale');
  if(w){
    w.classList.toggle('is-done', !falta && n > 0);
    $('#w-count').textContent = `${n}/${META_ATACADO}`;
    $('#w-now').textContent   = `${n} ${n === 1 ? 'peça' : 'peças'}`;
    $('#w-bar').style.width   = pct + '%';
    $('#w-txt').innerHTML = falta
      ? `Faltam <i>${falta} ${falta === 1 ? 'peça' : 'peças'}</i> para atacado`
      : `Preço de atacado liberado 🎉`;
    $('#w-sub').textContent = falta ? 'Adicione mais itens e economize!' : 'Todos os itens já estão com preço de fábrica.';
  }
  $$('[data-cart-total]').forEach(el => el.textContent = brl(Cart.total()));
}

/* ---------- 11. checkout ---------- */
function initCheckout(){
  const body = $('#ck-body');
  if(!body) return;

  // 1. tela "Carregando checkout..."
  setTimeout(() => {
    $('#ck-loading').style.display = 'none';
    body.classList.add('is-on');
    Toast.show('WOLFIE', 'Oiii Obrigada por escolher Wolfie 😍');
  }, 1800);

  // 2. resumo
  const items = Cart.read(), wholesale = Cart.pieces() >= META_ATACADO;
  const total = Cart.total();
  $('#ck-prods').innerHTML = items.map(it => {
    const p = CATALOG[it.id];
    return `<div class="ck-prod">
      <div class="ph grain ${p.ph}"></div>
      <div><b>${p.name} · ${it.size} / ${p.cor.toUpperCase()}</b>
      <em>${brl((wholesale ? p.atacado : p.varejo) * it.qty)}</em>
      <span>Qtd: ${it.qty}</span></div></div>`;
  }).join('') || '<p style="font-size:13px;color:var(--muted)">Nenhum item na sacola.</p>';
  $('#ck-count').textContent = `Produtos (${items.length})`;
  $('#ck-sub').textContent   = brl(total);
  $('#ck-tot').textContent   = brl(total);

  // 3. pessoa física / jurídica
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    $$('.seg button').forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on');
    const pj = b.dataset.type === 'pj';
    $('#doc-label').textContent = pj ? 'CNPJ' : 'CPF';
    $('#doc-input').placeholder = pj ? '00.000.000/0000-00' : '000.000.000-00';
    $('#name-label').textContent = pj ? 'Razão social' : 'Nome completo';
  }));

  // 4. contador da anotação
  const note = $('#ck-note');
  note?.addEventListener('input', () => $('#ck-cnt').textContent = `${note.value.length}/300 caracteres`);

  // 5. pop-up de cupom
  setTimeout(() => $('#pop-coupon')?.classList.add('is-on'), 7000);
  $('#apply-coupon')?.addEventListener('click', () => {
    $('#pop-coupon').classList.remove('is-on');
    $('#coupon-input').value = CUPOM.code;
    const novo = total * (1 - CUPOM.off);
    $('#ck-tot').textContent = brl(novo);
    $('#ck-disc').style.display = 'flex';
    $('#ck-disc span:last-child').textContent = '– ' + brl(total * CUPOM.off);
    Toast.show('Cupom aplicado', `${CUPOM.code} • 10% de desconto`);
  });
}

/* ---------- 12. modal de política ao abrir o carrinho ---------- */
function initPolicy(){
  const m = $('#policy');
  if(m && Cart.pieces() > 0) setTimeout(() => m.classList.add('is-on'), 700);
}

/* ---------- 13. aba de cupom + balão de chat ---------- */
function initFloats(){
  $('.coupon-tab')?.addEventListener('click', e => {
    e.preventDefault();
    Toast.show('Cupom da loja', `Use ${CUPOM.code} e ganhe 10% — válido exceto promoções`);
  });
  const bubble = $('.chat-bubble');
  if(bubble) setTimeout(() => bubble.classList.add('is-on'), 4200);
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initIcons(); initAtmosphere();
  initDrawer(); initHero(); initGallery(); initOptions(); initSizes();
  initAcc(); initModals(); initCep(); initBuy(); initFloats();
  Cart.paint(); renderCart(); initPolicy(); initCheckout();
});

window.WolfieCart = Cart;   // exposto para debug no console
})();
