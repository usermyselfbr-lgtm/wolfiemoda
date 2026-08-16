/* ==========================================================================
   WOLFIE — cálculo de frete
   --------------------------------------------------------------------------
   1. Consulta o CEP em APIs públicas reais (BrasilAPI → ViaCEP como fallback).
      Ambas liberam CORS, então funciona direto do navegador, sem backend.
   2. Calcula preço e prazo por zona (UF → região) + peso do pedido.
   3. Se FRETE_API estiver configurada, usa cotação real de transportadora
      (Melhor Envio via função serverless) e cai na tabela se a API falhar.
   ========================================================================== */
(() => {
'use strict';

/* ---------- configuração ---------- */
const CEP_ORIGEM = '74550050';            // fábrica — Goiânia/GO
const UF_ORIGEM  = 'GO';
const FRETE_GRATIS_A_PARTIR = 399.90;     // varejo, na modalidade econômica
const PESO_EMBALAGEM = 0.05;              // kg
const PESO_PADRAO    = 0.18;              // kg por peça, quando não declarado

/* Defina no HTML antes deste script para ativar cotação real:
   <script>window.WOLFIE_FRETE_API = 'https://seu-projeto.vercel.app/api/frete'</script> */
const FRETE_API = () => window.WOLFIE_FRETE_API || '';

/* ---------- zonas de entrega a partir de Goiânia ----------
   base = até 300 g · adicional = a cada 300 g excedentes · prazo em dias úteis */
const REGIOES = {
  LOCAL:   {uf:['GO'],                                   nome:'Goiás'},
  CO:      {uf:['DF','MS','MT'],                         nome:'Centro-Oeste'},
  SUDESTE: {uf:['SP','MG','RJ','ES'],                    nome:'Sudeste'},
  SUL:     {uf:['PR','SC','RS'],                         nome:'Sul'},
  NORDESTE:{uf:['BA','SE','AL','PE','PB','RN','CE','PI','MA'], nome:'Nordeste'},
  NORTE:   {uf:['TO','PA','AP','AM','RR','AC','RO'],     nome:'Norte'}
};

const TABELA = {
  LOCAL:   {pac:{base:12.90, add:2.50, min:3,  max:5},  sedex:{base:21.90, add:4.00, min:1,  max:2}},
  CO:      {pac:{base:16.90, add:3.00, min:4,  max:6},  sedex:{base:27.90, add:4.50, min:2,  max:3}},
  SUDESTE: {pac:{base:19.90, add:3.50, min:5,  max:8},  sedex:{base:32.90, add:5.50, min:2,  max:4}},
  SUL:     {pac:{base:22.90, add:3.80, min:6,  max:9},  sedex:{base:36.90, add:6.00, min:3,  max:5}},
  NORDESTE:{pac:{base:26.90, add:4.20, min:8,  max:13}, sedex:{base:44.90, add:7.00, min:4,  max:7}},
  NORTE:   {pac:{base:32.90, add:5.00, min:10, max:18}, sedex:{base:54.90, add:8.50, min:5,  max:9}}
};

const regiaoDaUF = uf => Object.keys(REGIOES).find(k => REGIOES[k].uf.includes(uf)) || 'SUDESTE';
const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const soNumero = s => (s || '').replace(/\D/g, '');

/* ---------- 1. consulta de CEP (duas fontes, com cascata) ---------- */
async function buscarCEP(cepRaw){
  const cep = soNumero(cepRaw);
  if(cep.length !== 8) throw new Error('CEP incompleto');

  const fontes = [
    { url:`https://brasilapi.com.br/api/cep/v2/${cep}`,
      map:d => ({cep, uf:d.state, cidade:d.city, bairro:d.neighborhood, rua:d.street, fonte:'BrasilAPI'}) },
    { url:`https://viacep.com.br/ws/${cep}/json/`,
      map:d => { if(d.erro) throw new Error('CEP não encontrado');
                 return {cep, uf:d.uf, cidade:d.localidade, bairro:d.bairro, rua:d.logradouro, fonte:'ViaCEP'}; } }
  ];

  let ultimoErro;
  for(const f of fontes){
    try{
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(f.url, {signal:ctrl.signal});
      clearTimeout(t);
      if(!r.ok) throw new Error(r.status === 404 ? 'CEP não encontrado' : 'Falha na consulta');
      const dados = f.map(await r.json());
      if(!dados.uf) throw new Error('CEP não encontrado');
      return dados;
    }catch(e){ ultimoErro = e; }
  }
  throw ultimoErro || new Error('Não foi possível consultar o CEP');
}

/* ---------- 2. peso e valor do pedido ---------- */
function pesoDosItens(itens){
  const cat = window.WolfieCatalog || {};
  const kg = itens.reduce((s,i) => s + ((cat[i.id]?.peso ?? PESO_PADRAO) * i.qty), 0);
  return Math.max(0.1, kg + PESO_EMBALAGEM);
}

function valorDosItens(itens){
  const cat = window.WolfieCatalog || {};
  const atacado = itens.reduce((s,i) => s + i.qty, 0) >= (window.WOLFIE_META_ATACADO || 12);
  return itens.reduce((s,i) => {
    const p = cat[i.id]; if(!p) return s;
    return s + (atacado ? p.atacado : p.varejo) * i.qty;
  }, 0);
}

/* ---------- 3. cotação por tabela de zona ---------- */
function cotarPorTabela(endereco, pesoKg, subtotal){
  const chave = regiaoDaUF(endereco.uf);
  const t = TABELA[chave];
  const excedente = Math.max(0, Math.ceil((pesoKg - 0.3) / 0.3));

  const monta = (id, nome, cfg, transportadora) => ({
    id, nome, transportadora,
    preco: +(cfg.base + cfg.add * excedente).toFixed(2),
    prazoMin: cfg.min, prazoMax: cfg.max
  });

  const opcoes = [
    monta('pac',   'PAC',   t.pac,   'Correios'),
    monta('sedex', 'SEDEX', t.sedex, 'Correios')
  ];

  // frete grátis no econômico acima do piso (regra de varejo da loja)
  if(subtotal >= FRETE_GRATIS_A_PARTIR){
    opcoes[0].precoOriginal = opcoes[0].preco;
    opcoes[0].preco = 0;
    opcoes[0].gratis = true;
  }

  // retirada na fábrica, só para Goiânia
  if(endereco.cidade && endereco.cidade.toLowerCase().includes('goiânia')){
    opcoes.push({id:'retirada', nome:'Retirar na fábrica', transportadora:'Wolfie · Setor Centro Oeste',
                 preco:0, prazoMin:0, prazoMax:1, gratis:true, retirada:true});
  }

  return {endereco, pesoKg, subtotal, regiao:REGIOES[chave].nome, opcoes, fonte:'tabela'};
}

/* ---------- 4. cotação real via função serverless (opcional) ---------- */
async function cotarPorAPI(endereco, pesoKg, subtotal, itens){
  const url = FRETE_API();
  if(!url) return null;
  try{
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'}, signal:ctrl.signal,
      body: JSON.stringify({cepOrigem:CEP_ORIGEM, cepDestino:endereco.cep, pesoKg, subtotal, itens})
    });
    clearTimeout(t);
    if(!r.ok) return null;
    const dados = await r.json();
    if(!Array.isArray(dados.opcoes) || !dados.opcoes.length) return null;

    const opcoes = dados.opcoes.map(o => ({...o}));
    if(subtotal >= FRETE_GRATIS_A_PARTIR){
      const eco = opcoes.reduce((a,b) => (b.preco < a.preco ? b : a), opcoes[0]);
      eco.precoOriginal = eco.preco; eco.preco = 0; eco.gratis = true;
    }
    return {endereco, pesoKg, subtotal, regiao:REGIOES[regiaoDaUF(endereco.uf)].nome, opcoes, fonte:'api'};
  }catch{ return null; }
}

/* ---------- 5. orquestração ---------- */
async function cotar({cep, itens}){
  const endereco = await buscarCEP(cep);
  const pesoKg   = pesoDosItens(itens);
  const subtotal = valorDosItens(itens);
  return (await cotarPorAPI(endereco, pesoKg, subtotal, itens))
      || cotarPorTabela(endereco, pesoKg, subtotal);
}

/* ---------- 6. interface ---------- */
const CEP_SALVO = 'wolfie.cep';

function itensDoBox(box){
  const Cart = window.WolfieCart;
  if(box.hasAttribute('data-carrinho')) return Cart ? Cart.read() : [];
  const id = box.dataset.produto;
  const qty = parseInt(document.querySelector('#qty')?.value || '1', 10) || 1;
  return id ? [{id, qty}] : [];
}

function pintar(out, r){
  const dias = o => o.prazoMin === 0
    ? 'hoje, se pedir até 15h'
    : (o.prazoMin === o.prazoMax ? `${o.prazoMax} dia útil` : `${o.prazoMin} a ${o.prazoMax} dias úteis`);

  out.innerHTML = `
    <div class="frete-end">
      <i data-ic="pin"></i>
      <div><b>${r.endereco.rua ? r.endereco.rua + ' · ' : ''}${r.endereco.bairro || ''}</b>
      <span>${r.endereco.cidade}/${r.endereco.uf} · CEP ${r.endereco.cep.replace(/(\d{5})(\d{3})/,'$1-$2')}</span></div>
    </div>
    <ul class="frete-ops">
      ${r.opcoes.map(o => `
        <li class="${o.gratis ? 'is-free' : ''}">
          <div class="frete-ops__n"><b>${o.nome}</b><span>${o.transportadora}</span></div>
          <div class="frete-ops__p">
            <b>${o.gratis ? 'Grátis' : brl(o.preco)}</b>
            ${o.precoOriginal ? `<s>${brl(o.precoOriginal)}</s>` : ''}
            <span>${dias(o)}</span>
          </div>
        </li>`).join('')}
    </ul>
    <p class="frete-meta">
      Peso do pedido: ${r.pesoKg.toFixed(2).replace('.',',')} kg · região ${r.regiao} ·
      ${r.fonte === 'api' ? 'cotação da transportadora' : 'tabela Wolfie'}
      ${r.subtotal < FRETE_GRATIS_A_PARTIR
        ? `<br><b>Faltam ${brl(FRETE_GRATIS_A_PARTIR - r.subtotal)}</b> para frete grátis no PAC.`
        : ''}
    </p>`;
  out.classList.add('is-on');
  window.WolfieIcons?.(out);
}

function mensagem(out, texto, tipo){
  out.innerHTML = `<p class="frete-msg ${tipo}">${texto}</p>`;
  out.classList.add('is-on');
}

function montar(box){
  const input = box.querySelector('input');
  const btn   = box.querySelector('button');
  const out   = box.querySelector('.cep-out');
  if(!input || !btn || !out) return;

  // máscara + memória do último CEP
  input.addEventListener('input', () => {
    const v = soNumero(input.value).slice(0,8);
    input.value = v.length > 5 ? v.slice(0,5) + '-' + v.slice(5) : v;
    input.style.borderColor = '';
  });
  const salvo = localStorage.getItem(CEP_SALVO);
  if(salvo) input.value = salvo.replace(/(\d{5})(\d{3})/,'$1-$2');

  const calcular = async () => {
    const cep = soNumero(input.value);
    if(cep.length !== 8){
      input.style.borderColor = 'var(--price)'; input.focus();
      return mensagem(out, 'Digite um CEP com 8 dígitos.', 'erro');
    }
    const itens = itensDoBox(box);
    if(!itens.length) return mensagem(out, 'Adicione um item para calcular o frete.', 'erro');

    btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = 'Calculando…';
    mensagem(out, '<span class="frete-load"></span> Consultando CEP e transportadoras…', 'load');
    try{
      const r = await cotar({cep, itens});
      localStorage.setItem(CEP_SALVO, cep);
      pintar(out, r);
      document.dispatchEvent(new CustomEvent('wolfie:frete', {detail:r}));
    }catch(e){
      mensagem(out, e.message === 'CEP não encontrado'
        ? 'CEP não encontrado. Confira o número digitado.'
        : 'Não conseguimos calcular agora. Tente de novo em instantes ou fale no WhatsApp.', 'erro');
    }finally{
      btn.disabled = false; btn.textContent = btn.dataset.txt || 'Calcular';
    }
  };

  btn.addEventListener('click', calcular);
  input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); calcular(); } });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-cep]').forEach(montar);
});

window.WolfieFrete = {cotar, buscarCEP, cotarPorTabela, TABELA, REGIOES, CEP_ORIGEM};
})();
