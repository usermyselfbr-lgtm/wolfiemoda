/* ==========================================================================
   WOLFIE — tracking (GA4 + Meta Pixel)
   Desligado por padrão: preencha os IDs abaixo para ativar.
   Os eventos seguem os nomes recomendados do GA4 (ecommerce) e são
   espelhados nos eventos padrão do Meta Pixel.
   ========================================================================== */
(() => {
'use strict';

/* ---------- configuração ---------- */
const GA4_ID        = '';   // ex.: 'G-XXXXXXXXXX'
const META_PIXEL_ID = '';   // ex.: '123456789012345'

/* GA4 → Meta. Finalizar no WhatsApp é a conversão da loja (InitiateCheckout). */
const META_EVENT = {
  view_item:      'ViewContent',
  add_to_cart:    'AddToCart',
  begin_checkout: 'InitiateCheckout',
  generate_lead:  'Lead',
  contact:        'Contact'
};

/* ---------- UTMs de primeiro toque (atribuição do pedido no WhatsApp) ---------- */
const UTM_KEY = 'wolfie.utm';
try{
  const q = new URLSearchParams(location.search);
  const utm = {};
  ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(k => { if(q.get(k)) utm[k] = q.get(k).slice(0, 60); });
  if(q.get('fbclid') && !utm.utm_source) utm.utm_source = 'meta';
  if(q.get('gclid')  && !utm.utm_source) utm.utm_source = 'google';
  if(Object.keys(utm).length && !localStorage.getItem(UTM_KEY)) localStorage.setItem(UTM_KEY, JSON.stringify(utm));
}catch{}
const origem = () => { try{ return JSON.parse(localStorage.getItem(UTM_KEY)) || null; }catch{ return null; } };

/* ---------- loaders ---------- */
if(GA4_ID){
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA4_ID);
}
if(META_PIXEL_ID){
  /* snippet oficial do Meta Pixel */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

/* ---------- API pública ----------
   WolfieTrack('add_to_cart', {value, items:[{item_id, item_name, item_category, price, quantity}]}) */
function track(evento, params = {}){
  const p = {currency:'BRL', ...params};
  try{ window.gtag?.('event', evento, p); }catch{}
  try{
    const meta = META_EVENT[evento];
    if(meta && window.fbq){
      const items = p.items || [];
      fbq('track', meta, {
        currency:p.currency, value:p.value,
        content_type:'product',
        content_ids:items.map(i => i.item_id),
        contents:items.map(i => ({id:i.item_id, quantity:i.quantity})),
        num_items:items.reduce((s,i) => s + (i.quantity || 0), 0) || undefined
      });
    }
  }catch{}
  if(location.hostname === 'localhost') console.debug('[track]', evento, p);
}

/* cliques em qualquer link de WhatsApp contam como contato */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href*="wa.me/"]');
  if(!a || a.hasAttribute('data-wpp-checkout')) return;
  track('contact', {method:'whatsapp', origem:a.dataset.track || 'link'});
}, true);

window.WolfieTrack = track;
window.WolfieOrigem = origem;
})();
