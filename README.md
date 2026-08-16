# Wolfie — loja estática

Front-end completo de e-commerce de moda (varejo + atacado), em **HTML + CSS + JS puro**.
Sem framework, sem build, sem `node_modules`. A única dependência externa são as fontes do
Google (Poppins + Playfair Display).

> Referência: reimplementação da estrutura de um tema brasileiro de Shopify com checkout
> transparente. Todo o código aqui foi escrito do zero; nenhuma imagem de terceiros foi copiada.

## Rodar localmente

Abra `index.html` no navegador. Só isso. Para servir por HTTP:

```bash
python3 -m http.server 8080
```

## Publicar no GitHub Pages

1. Crie um repositório novo (ex.: `wolfie`) e suba o conteúdo **desta pasta na raiz** do repositório
   — `index.html` precisa ficar na raiz, não dentro de uma subpasta.
2. No repositório: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`** → Save.
3. Em ~1 minuto o site sai em `https://<seu-usuario>.github.io/<repo>/`.
4. Abra os HTML e troque `https://SEU-USUARIO.github.io/wolfie/` pela URL real nas tags
   `canonical`, `og:url` e `og:image` (busque por `SEU-USUARIO`).

O arquivo `.nojekyll` já está incluso para o GitHub não processar o site com Jekyll.
O `404.html` na raiz é servido automaticamente pelo Pages em rotas inexistentes.

### Subindo pela linha de comando

```bash
git init && git add . && git commit -m "feat: loja Wolfie" && git branch -M main && git remote add origin https://github.com/SEU-USUARIO/wolfie.git && git push -u origin main
```

### Domínio próprio

Crie um arquivo `CNAME` na raiz com o domínio (ex.: `usewolfie.com.br`) e aponte o DNS para o
GitHub Pages. Ative "Enforce HTTPS" em Settings → Pages.

## Estrutura

```
.
├── index.html          home
├── colecao.html        listagem de coleção (PLP)
├── produto.html        página de produto (PDP)
├── carrinho.html       carrinho + barra de atacado
├── checkout.html       checkout visual em 4 passos
├── sobre.html          institucional
├── 404.html            página de erro (servida pelo Pages)
├── assets/
│   ├── css/style.css   design system + refinamento (seções 1–21)
│   ├── js/app.js       catálogo, carrinho, efeitos, ícones SVG
│   ├── favicon.svg     monograma W
│   └── og.jpg          imagem de compartilhamento 1200×630
├── .nojekyll           desliga o Jekyll no GitHub Pages
├── CONTRIBUTING.md     onde mexer em cada coisa
└── README.md
```

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Home — hero slideshow, coleções, vitrine com preço duplo varejo/atacado, promoção, acessórios |
| `colecao.html` | PLP — banner de coleção, contagem, ordenação, densidade, grid 4 col |
| `produto.html` | PDP — galeria com lente de zoom, variações, Provador Virtual/Tabela de Medidas, frete por CEP, acordeões |
| `carrinho.html` | Carrinho — **barra de progresso de atacado (x/12)** + modal de política de troca |
| `checkout.html` | Checkout em 4 passos, PF/PJ, resumo, cupom automático |
| `sobre.html` | Institucional |

## Regras de negócio implementadas (iguais ao modelo)

- **Atacado:** `META_ATACADO = 12` peças variadas → ao atingir, todos os preços do carrinho viram preço de fábrica automaticamente (≈ −30%).
- **Frete grátis (varejo):** acima de `R$ 399,90`.
- **PIX:** 5% de desconto exibido na PDP e no checkout.
- **Cupom `WOLFIE10`:** 10%, oferecido por pop-up no checkout após 7 s.
- Carrinho persistido em `localStorage` (`wolfie.cart`) — funciona entre as páginas.

Tudo em `assets/js/app.js`, topo do arquivo (`CATALOG`, `META_ATACADO`, `FRETE_GRATIS`, `CUPOM`).

## Trocar as fotos

Todo bloco de imagem é um placeholder:

```html
<div class="ph grain g-terra"></div>
```

Substitua por:

```html
<img src="assets/img/vestido-01.jpg" alt="Vestido Selvagem" style="aspect-ratio:4/5;object-fit:cover;width:100%">
```

Ou mantenha a `div` e aplique a foto por CSS:

```css
.ph.foto-1::before{ background:url('../img/vestido-01.jpg') center/cover }
```

Paletas de placeholder disponíveis: `g-peach · g-sand · g-blue · g-noir · g-terra · g-olive · g-rose · g-stone · g-lagoon`.

## Design tokens

Em `assets/css/style.css`, bloco `:root` — cores, raios, sombras, o fio degradê arco-íris e a largura do container.
Trocar a identidade inteira = editar esse bloco.

## Ícones

Sem Font Awesome / Ionicons. Um mapa de SVGs inline em `app.js` (`ICONS`) é injetado em qualquer
elemento com `data-ic="nome"`. Nomes: shield, truck, refresh, chat, heart, card, ticket, cart, bag,
box, back, zoom, hanger, ruler, lock, mail, store, check, checkc, book, info, percent, pix, wpp, trash, bell.

## O que é fake (por ser estático)

- Busca, newsletter e login não têm backend.
- O cálculo de frete devolve valores fixos (`initCep`) — plugar API dos Correios/Melhor Envio ali.
- O checkout não processa pagamento; é a casca visual dos 4 passos.

## Camada de refinamento (seção 20 do CSS + `initAtmosphere()`)

Efeitos adicionados sobre a base, todos reversíveis apagando a seção 20 do `style.css`:

**Gradientes de marca** — `--grad-brand` (verde→lima), `--grad-cta`, `--grad-warm` (pêssego→terracota),
`--grad-ink`. Usados em: sublinhado dos títulos de seção, barra de atacado, CTAs, badges, chips ativos,
total do checkout (texto em gradiente) e hover do menu lateral.

**Atmosfera** — fundo da página com leve degradê + dois halos radiais fixos (verde e âmbar) atrás do
conteúdo; vinheta e brilho diagonal nas fotos; máscara de fade nas pontas dos marquees; fio arco-íris
com glow.

**Motion** — reveal no scroll com blur→nítido e stagger nos grids (IntersectionObserver, `rootMargin`
de 220px para antecipar); header vira vidro fosco e encolhe ao rolar; barra de progresso de leitura no
topo; ken burns lento no hero; dots do slideshow preenchem em 6s; sheen diagonal atravessando os botões
verdes; shimmer contínuo na barra de atacado; badge do carrinho com pop; halo pulsante no WhatsApp;
spring nos modais e no toast.

**Lupa de verdade na PDP** — a lente agora amplia 2,4x a região sob o cursor (antes era um círculo
branco decorativo). Funciona igual quando você trocar o placeholder por foto real.

**Segunda foto no hover do card** — crossfade para uma variação da mesma peça. Com fotos reais, troque
o `.ph--alt` por um segundo `<img>` e o efeito continua o mesmo.

**Estados do atacado** — ao completar 12 peças a barra inteira vira verde (`.is-done`), o texto muda
para "Preço de atacado liberado 🎉" e todos os preços do carrinho caem para o de fábrica.

**Acessibilidade** — `focus-visible` com anel verde em tudo que é focável, `prefers-reduced-motion`
desliga todas as animações, `@media print` revela o conteúdo e esconde flutuantes.

## Antes de ir para produção

- [ ] Trocar `SEU-USUARIO.github.io` pela URL real (canonical / og:url / og:image)
- [ ] Trocar o WhatsApp `5562999990000` pelo número real (links `wa.me` e rodapé)
- [ ] Ligar Facebook e TikTok (hoje `href="#"`) — Instagram já aponta para `@usewolfie.br`
- [ ] Substituir CNPJ, endereço e e-mail de contato
- [ ] Trocar os placeholders `.ph` por fotos reais
- [ ] Plugar frete real em `initCep()` e um checkout de verdade (Yampi/Appmax) no `FINALIZAR COMPRA`
- [ ] Adicionar GA4 / Meta Pixel se for rodar tráfego pago
