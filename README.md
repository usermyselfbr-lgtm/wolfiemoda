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
│   ├── css/style.css   design system + refinamento (seções 1–23)
│   ├── js/app.js       catálogo, carrinho, efeitos, ícones SVG
│   ├── js/frete.js     cálculo de frete (CEP real + zonas + cotação opcional)
│   ├── js/shop.js      conversão: mini-carrinho, barra fixa, filtros, validação
│   ├── brand/          logo e ícones oficiais (ver abaixo)
│   └── og.jpg          imagem de compartilhamento 1200×630
├── site.webmanifest    ícones e cores para instalar como app
├── api/frete.js        função serverless p/ cotação real (Vercel) — opcional
├── FRETE.md            como o frete funciona e como ligar na transportadora
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

## Catálogo (5 SKUs)

| Produto | Categoria | Varejo | PIX (−5%) | Atacado (12+) | Parcelas |
|---|---|---|---|---|---|
| Body Basic | BODY | R$ 79,90 | R$ 75,91 | R$ 55,93 | 6x R$ 13,32 |
| Cropped Multiformas | CROPPED | ~~R$ 99,90~~ **R$ 69,90** | — | R$ 48,93 | 3x R$ 23,30 |
| Body com Recorte Quadrado | BODY | R$ 99,90 | R$ 94,91 | R$ 69,93 | 6x R$ 16,65 |
| Cropped Manguinha | CROPPED | R$ 74,90 | R$ 71,16 | R$ 52,43 | 6x R$ 12,48 |
| Body Costas Livres | BODY | R$ 94,90 | R$ 90,16 | R$ 66,43 | 6x R$ 15,82 |

Preço de atacado = 70% do varejo. Para mudar qualquer valor, edite `CATALOG` no topo de
`assets/js/app.js` **e** o card correspondente em `index.html` / `colecao.html` / `produto.html`
(o HTML é estático de propósito, para o Google indexar o preço).

Tamanhos P/M/G/GG (veste do 36 ao 44). Cores por peça estão no `CATALOG` (campo `cores`).

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

## Frete (conectado)

O CEP é consultado em API pública real — **BrasilAPI** com **ViaCEP** como reserva — e o preço sai
de uma tabela de zonas por UF + peso do pedido, com frete grátis acima de R$ 399,90 e retirada na
fábrica para Goiânia. Funciona no site estático, sem backend.

Para cotação real de transportadora existe `api/frete.js` (Melhor Envio via função serverless):
faça o deploy, configure o token e aponte `window.WOLFIE_FRETE_API`. Se a API falhar, o site cai
sozinho na tabela. Detalhes em **[FRETE.md](FRETE.md)**.

## O que ainda é fake (por ser estático)

- Busca, newsletter e login não têm backend.
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

## Marca

Arquivos oficiais processados em `assets/brand/`:

| Arquivo | Uso |
|---|---|
| `icone-512/192/180/32.png`, `favicon.ico` | ícone do navegador, atalho de celular e manifest — é a ID visual da marca (W + coração em preto) |
| `wordmark-flat.png` | wordmark no cabeçalho, rodapé e checkout (bronze sólido `#6b4636`) |
| `logo-light.png` | lockup original pérola — **só sobre fundo escuro** |
| `logo-dark.png` | lockup metálico escurecido para fundo claro |
| `logo-flat.png` | lockup chapado, para tamanhos pequenos e impressão |
| `monograma.png` | só o W, fundo transparente |

**Por que existem versões escuras:** o logo original é pérola/rosé (`#f3e6da`) e tem contraste de
**1,23:1 contra branco** — some no cabeçalho. Contra preto são 17,1:1. Por isso o ícone usa fundo
preto (como a própria ID visual da marca) e o cabeçalho usa a versão bronze (**7,7:1**).
Se a designer produzir uma versão oficial para fundo claro, é só substituir `wordmark-flat.png`.

## Camada de conversão (`shop.js` + CSS seção 24)

Padrões das grandes de moda, implementados:

- **CTA primário preto** (contraste 18,9:1). O verde virou sinal exclusivo de economia — PIX, frete
  grátis, atacado — no tom AA `#0b7a3d`. Vermelho `#d1354a` só para liquidação.
- **Mini-carrinho em gaveta** ao adicionar, com duas metas: frete grátis (R$ 399,90) e preço de
  fábrica (12 peças), cada uma com barra de progresso.
- **Barra fixa de compra** na PDP quando o botão sai da tela — com miniatura, tamanho e preço.
- **Tamanho obrigatório**: sem escolher, o produto não entra na sacola (erro em vermelho no seletor).
- **Filtros e ordenação funcionais** na vitrine, com contagem por categoria e faixa de preço.
- **Bloco de confiança** na PDP (troca, segurança, fabricação própria) e aviso de estoque baixo
  — este último só aparece se você definir `estoque` no `CATALOG`; por padrão fica desligado.
- **Dados estruturados** JSON-LD: `OnlineStore`, `Product` com `Offer`/frete/devolução,
  `BreadcrumbList` e `ItemList`.

## Antes de ir para produção

- [ ] Trocar `SEU-USUARIO.github.io` pela URL real (canonical / og:url / og:image)
- [ ] Trocar o WhatsApp `5562999990000` pelo número real (links `wa.me` e rodapé)
- [ ] Ligar Facebook e TikTok (hoje `href="#"`) — Instagram já aponta para `@usewolfie.br`
- [ ] Substituir CNPJ, endereço e e-mail de contato
- [ ] Trocar os placeholders `.ph` por fotos reais
- [ ] (opcional) Deploy da `api/frete.js` com token da transportadora — ver FRETE.md
- [ ] Plugar um checkout de verdade (Yampi/Appmax) no `FINALIZAR COMPRA`
- [ ] Adicionar GA4 / Meta Pixel se for rodar tráfego pago
