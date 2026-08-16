/* ==========================================================================
   WOLFIE — camada de conversão
   Mini-carrinho em gaveta, barra fixa de compra, validação de tamanho,
   filtros da vitrine e metas de frete grátis / atacado.
   Padrões usados pelas grandes de moda (Zara, Amaro, Farfetch, Renner).
   Depende de app.js (WolfieCart, WolfieCatalog, WolfieIcons).
   ========================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const cat = () => window.WolfieCatalog || {};
const cart = () => window.WolfieCart;

const META_ATACADO = () => window.WOLFIE_META_ATACADO || 12;
const FRETE_GRATIS = 399.90;

/* ==========================================================================
   1. MINI-CARRINHO — abre ao adicionar, com metas de frete e atacado
   ========================================================================== */
const Mini = {
  el: null,

  build(){
    if(this.el) return;
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.id = 'mini-scrim';
    scrim.addEventListener('click', () => this.close());

    const el = document.createElement('aside');
    el.className = 'mini';
    el.setAttribute('aria-label', 'Sacola de compras');
    el.innerHTML = `
      <div class="mini__h">
        <b>Sua sacola (<span data-mini-count>0</span>)</b>
        <button data-mini-close aria-label="Fechar">×</button>
      </div>
      <div class="mini__goals">
        <div class="goal" data-goal="frete">
          <b></b><div class="track2"><i></i></div>
        </div>
        <div class="goal" data-goal="atacado">
          <b></b><div class="track2"><i></i></div>
        </div>
      </div>
      <div class="mini__list" data-mini-list></div>
      <div class="mini__f">
        <div class="mini__row"><span>Subtotal</span><b data-mini-total>R$ 0,00</b></div>
        <a href="checkout.html" class="mini__cta">FINALIZAR COMPRA</a>
        <a href="carrinho.html" class="mini__link">Ver sacola completa</a>
      </div>`;

    document.body.append(scrim, el);
    $('[data-mini-close]', el).addEventListener('click', () => this.close());
    this.el = el;
    this.scrim = scrim;
    document.addEventListener('keydown', e => { if(e.key === 'Escape') this.close(); });
  },

  open(){
    this.build(); this.render();
    this.el.classList.add('is-on');
    this.scrim.classList.add('is-on');
    document.body.style.overflow = 'hidden';
  },

  close(){
    this.el?.classList.remove('is-on');
    this.scrim?.classList.remove('is-on');
    document.body.style.overflow = '';
  },

  render(){
    if(!this.el) return;
    const C = cart(); if(!C) return;
    const itens = C.read(), pecas = C.pieces(), total = C.total();

    $('[data-mini-count]', this.el).textContent = pecas;
    $('[data-mini-total]', this.el).textContent = brl(total);

    // meta 1 — frete grátis
    const faltaFrete = Math.max(0, FRETE_GRATIS - total);
    const g1 = $('[data-goal="frete"]', this.el);
    g1.classList.toggle('is-done', faltaFrete === 0 && total > 0);
    $('b', g1).innerHTML = faltaFrete === 0 && total > 0
      ? '✓ Frete grátis liberado no PAC'
      : `Faltam <i>${brl(faltaFrete)}</i> para frete grátis`;
    $('.track2 i', g1).style.width = Math.min(100, total / FRETE_GRATIS * 100) + '%';

    // meta 2 — preço de atacado
    const meta = META_ATACADO(), faltaAtacado = Math.max(0, meta - pecas);
    const g2 = $('[data-goal="atacado"]', this.el);
    g2.classList.toggle('is-done', faltaAtacado === 0 && pecas > 0);
    $('b', g2).innerHTML = faltaAtacado === 0 && pecas > 0
      ? '✓ Preço de fábrica aplicado'
      : `Faltam <i>${faltaAtacado} ${faltaAtacado === 1 ? 'peça' : 'peças'}</i> para preço de fábrica`;
    $('.track2 i', g2).style.width = Math.min(100, pecas / meta * 100) + '%';

    // itens
    const lista = $('[data-mini-list]', this.el);
    const atacado = pecas >= meta;
    lista.innerHTML = itens.length ? itens.map((it, idx) => {
      const p = cat()[it.id]; if(!p) return '';
      const preco = (atacado ? p.atacado : p.varejo) * it.qty;
      return `<div class="mini__i">
        <div class="ph grain ${p.ph}"></div>
        <div style="flex:1">
          <b>${p.name}</b>
          <span>${it.size} · ${p.cor}</span>
          <em>${brl(preco)}</em>
          <div class="mini__q">
            <button data-q="-" data-i="${idx}" aria-label="Diminuir">−</button>
            <span>${it.qty}</span>
            <button data-q="+" data-i="${idx}" aria-label="Aumentar">+</button>
            <button class="mini__x" data-q="x" data-i="${idx}" aria-label="Remover item">×</button>
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="mini__empty">Sua sacola está vazia.<br><a href="colecao.html" style="text-decoration:underline">Ver catálogo</a></div>`;

    $$('[data-q]', lista).forEach(b => b.addEventListener('click', () => {
      const itens = cart().read(), i = +b.dataset.i;
      if(b.dataset.q === '+') itens[i].qty++;
      else if(b.dataset.q === '-') itens[i].qty > 1 ? itens[i].qty-- : itens.splice(i, 1);
      else itens.splice(i, 1);
      cart().write(itens);
      this.render();
    }));

    window.WolfieIcons?.(this.el);
  }
};

/* ==========================================================================
   2. VALIDAÇÃO DE TAMANHO + interceptação dos botões de compra
   ========================================================================== */
function tamanhoEscolhido(){
  const row = $('.opt__row[data-out="#out-size"]');
  if(!row) return 'M';
  const on = $('.chip.is-on', row);
  return on ? on.textContent.trim() : null;
}

function exigirTamanho(){
  const box = $('.opt__row[data-out="#out-size"]')?.closest('.opt');
  if(!box) return true;
  if(tamanhoEscolhido()) { box.classList.remove('is-error'); return true; }
  box.classList.add('is-error');
  box.scrollIntoView({behavior:'smooth', block:'center'});
  return false;
}

function ligarCompra(){
  // captura antes do handler do app.js e cancela se faltar tamanho
  $$('[data-add],[data-buy]').forEach(btn => {
    btn.addEventListener('click', e => {
      if(!exigirTamanho()){ e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
  });

  // ao adicionar (sem sair da página), abre a gaveta
  $$('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => { if(tamanhoEscolhido()) setTimeout(() => Mini.open(), 90); });
  });

  // ícone da sacola no header abre a gaveta em vez de navegar
  $$('a[href="carrinho.html"]').forEach(a => {
    if(!a.closest('.icons')) return;
    a.addEventListener('click', e => { e.preventDefault(); Mini.open(); });
  });

  // quick-add da vitrine: manda para a PDP escolher tamanho (padrão de moda)
  $$('.card__quick').forEach(q => q.addEventListener('click', e => {
    const card = q.closest('.card');
    if(card?.href){ e.preventDefault(); location.href = card.href; }
  }));
}

/* ==========================================================================
   3. BARRA FIXA DE COMPRA (PDP)
   ========================================================================== */
function barraDeCompra(){
  const add = $('[data-add]');
  if(!add) return;
  const id = add.dataset.add, p = cat()[id];
  if(!p) return;

  const bar = document.createElement('div');
  bar.className = 'buybar';
  bar.innerHTML = `
    <div class="wrap buybar__in">
      <div class="ph grain ${p.ph}"></div>
      <div class="buybar__i">
        <b>${p.name}</b>
        <span>Tam. <u data-bar-size>${tamanhoEscolhido() || '—'}</u></span>
        <em>${brl(p.varejo)}</em>
      </div>
      <div class="buybar__sz"></div>
      <button class="buybar__cta">Adicionar</button>
    </div>`;
  document.body.appendChild(bar);

  // espelha os tamanhos da página
  const sz = $('.buybar__sz', bar);
  $$('.opt__row[data-out="#out-size"] .chip').forEach(chip => {
    const b = document.createElement('button');
    b.textContent = chip.textContent.trim();
    b.className = chip.classList.contains('is-on') ? 'is-on' : '';
    b.addEventListener('click', () => { chip.click(); });
    sz.appendChild(b);
  });
  const sincroniza = () => {
    const t = tamanhoEscolhido();
    $('[data-bar-size]', bar).textContent = t || '—';
    $$('button', sz).forEach(b => b.classList.toggle('is-on', b.textContent.trim() === t));
  };
  $('.opt__row[data-out="#out-size"]')?.addEventListener('click', () => setTimeout(sincroniza, 20));

  $('.buybar__cta', bar).addEventListener('click', () => {
    if(!exigirTamanho()) return;
    cart().add(id, tamanhoEscolhido(), parseInt($('#qty')?.value || '1', 10));
    Mini.open();
  });

  // aparece quando o bloco de compra sai da tela
  const alvo = $('.cta-row') || $('.cta-buy');
  if(alvo && 'IntersectionObserver' in window){
    new IntersectionObserver(([e]) => {
      const mostrar = !e.isIntersecting && e.boundingClientRect.top < 0;
      bar.classList.toggle('is-on', mostrar);
      document.documentElement.style.setProperty('--bar-h', mostrar ? bar.offsetHeight + 'px' : '0px');
    }, {threshold:0}).observe(alvo);
  }
}

/* ==========================================================================
   4. FILTROS DA VITRINE (PLP)
   ========================================================================== */
function filtros(){
  const grid = $('.plp-tools')?.parentElement?.querySelector('.grid');
  if(!grid) return;
  const cards = $$('.card', grid);
  if(!cards.length) return;

  // marca cada card com sua categoria e faixa de preço a partir do catálogo
  const porNome = {};
  Object.entries(cat()).forEach(([id, p]) => porNome[p.name] = {id, ...p});
  cards.forEach(c => {
    const nome = $('.card__name', c)?.textContent.trim();
    const p = porNome[nome];
    if(p){ c.dataset.cat = p.cat; c.dataset.preco = p.varejo; c.dataset.id = p.id; }
  });

  const cats = [...new Set(cards.map(c => c.dataset.cat).filter(Boolean))];
  const box = document.createElement('div');
  box.className = 'filters';
  box.innerHTML = `
    <div class="filters__g"><b>Categoria</b>
      <button class="fchip is-on" data-f="todos">Todos <span class="fchip__n">${cards.length}</span></button>
      ${cats.map(c => `<button class="fchip" data-f="${c}">${c[0] + c.slice(1).toLowerCase()}
        <span class="fchip__n">${cards.filter(x => x.dataset.cat === c).length}</span></button>`).join('')}
    </div>
    <div class="filters__g"><b>Preço</b>
      <button class="fchip" data-p="0-79.9">até R$ 79,90</button>
      <button class="fchip" data-p="80-999">R$ 80 ou mais</button>
    </div>
    <a href="#" class="filters__clear">Limpar filtros</a>`;
  $('.plp-tools').after(box);

  const contador = document.createElement('p');
  contador.className = 'plp-count';
  box.after(contador);

  let fCat = 'todos', fPreco = null;

  const aplicar = () => {
    let n = 0;
    cards.forEach(c => {
      const okCat = fCat === 'todos' || c.dataset.cat === fCat;
      let okPreco = true;
      if(fPreco){
        const [a, b] = fPreco.split('-').map(Number);
        const v = parseFloat(c.dataset.preco || 0);
        okPreco = v >= a && v <= b;
      }
      const ok = okCat && okPreco;
      c.classList.toggle('is-hidden', !ok);
      if(ok) n++;
    });
    contador.textContent = `${n} ${n === 1 ? 'produto' : 'produtos'}`;
    $('.plp-head p')?.replaceChildren(document.createTextNode(
      `${n} ${n === 1 ? 'produto' : 'produtos'} · bodies e croppeds`));
  };

  $$('[data-f]', box).forEach(b => b.addEventListener('click', () => {
    $$('[data-f]', box).forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on'); fCat = b.dataset.f; aplicar();
  }));
  $$('[data-p]', box).forEach(b => b.addEventListener('click', () => {
    const ativo = b.classList.contains('is-on');
    $$('[data-p]', box).forEach(x => x.classList.remove('is-on'));
    if(!ativo){ b.classList.add('is-on'); fPreco = b.dataset.p; } else fPreco = null;
    aplicar();
  }));
  $('.filters__clear', box).addEventListener('click', e => {
    e.preventDefault();
    fCat = 'todos'; fPreco = null;
    $$('.fchip', box).forEach(x => x.classList.remove('is-on'));
    $('[data-f="todos"]', box).classList.add('is-on');
    aplicar();
  });

  // ordenação passa a funcionar
  const sel = $$('.plp-tools select')[1];
  sel?.addEventListener('change', () => {
    const v = sel.value, arr = cards.slice();
    if(v.includes('Menor')) arr.sort((a,b) => a.dataset.preco - b.dataset.preco);
    else if(v.includes('Maior')) arr.sort((a,b) => b.dataset.preco - a.dataset.preco);
    arr.forEach(c => grid.appendChild(c));
  });

  aplicar();
}

/* ==========================================================================
   5. ESTOQUE E CONFIANÇA NA PDP
   ========================================================================== */
function confianca(){
  const ship = $('.ship');
  if(!ship) return;

  const trust = document.createElement('div');
  trust.className = 'trust';
  trust.innerHTML = `
    <div><i data-ic="refresh"></i><b>Troca fácil</b><span>7 dias</span></div>
    <div><i data-ic="lock"></i><b>Compra segura</b><span>site protegido</span></div>
    <div><i data-ic="store"></i><b>Fabricação própria</b><span>Goiânia/GO</span></div>`;
  ship.after(trust);

  // aviso de estoque: só aparece se a peça estiver marcada no catálogo
  const id = $('[data-add]')?.dataset.add;
  const p = cat()[id];
  if(p?.estoque != null && p.estoque <= 10){
    const s = document.createElement('p');
    s.className = 'stock';
    s.innerHTML = `<i></i> Últimas ${p.estoque} peças nesta cor`;
    $('.price-main')?.after(s);
  }
  window.WolfieIcons?.(document.body);
}

/* ==========================================================================
   boot
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  ligarCompra();
  barraDeCompra();
  filtros();
  confianca();
  // mantém a gaveta sincronizada com qualquer alteração do carrinho
  const paint = cart()?.paint?.bind(cart());
  if(paint) cart().paint = function(){ paint(); Mini.render(); };
});

window.WolfieMini = Mini;
})();
