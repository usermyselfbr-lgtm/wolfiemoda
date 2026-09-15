# Wolfie — histórico do projeto

Registro da análise de mercado, das decisões técnicas e da construção da loja.
Documento de handoff: quem pegar o projeto depois entende **o que foi feito e por quê**.

Período: 15–16 de agosto de 2026.

---

## Índice

1. [Ponto de partida](#1-ponto-de-partida)
2. [Análise dos três sites de referência](#2-análise-dos-três-sites-de-referência)
3. [Transcrição das gravações de tela](#3-transcrição-das-gravações-de-tela)
4. [O modelo de negócio destilado](#4-o-modelo-de-negócio-destilado)
5. [Construção da loja Wolfie](#5-construção-da-loja-wolfie)
6. [Identidade visual](#6-identidade-visual)
7. [Refinamento visual](#7-refinamento-visual)
8. [Frete conectado](#8-frete-conectado)
9. [Auditoria e nível e-commerce](#9-auditoria-e-nível-e-commerce)
10. [Estado atual](#10-estado-atual)
11. [Pendências](#11-pendências)
12. [Comandos úteis](#12-comandos-úteis)

---

## 1. Ponto de partida

Três lojas de moda feminina foram enviadas para análise de "como foram criadas":

| Loja | URL |
|---|---|
| Florence Moda Feminina | `facilzap.app.br/florencemodafeminina/c/atacado/62991920184` |
| Florata Modas | `floratamodafeminina.com.br/c/atacado` |
| Empório Body | `emporiobody.com.br` |

O pedido evoluiu para: replicar o modelo do Empório Body sob a marca **Wolfie**.

---

## 2. Análise dos três sites de referência

Método: `curl` do HTML bruto, leitura de headers, DNS e inspeção dos assets.

### Florence e Florata — a mesma plataforma

**Descoberta principal:** não são dois sites. É o **mesmo SaaS (FacilZap)** com domínios
diferentes — a Florata apenas apontou o domínio próprio para a plataforma.

Evidências:

- Assets idênticos vindos de `assets-cdn.facilzap.app.br/componentes/catalogo/`
- `x-powered-by: PHP/7.4.33` atrás de Cloudflare
- `bower_components/` → jQuery + Bootstrap 4 gerenciados por **Bower** (legado de ~2016)
- `vue/facilzap.1.0.1.min.js` + `v-if`/`v-for` → Vue 2 pontual sobre HTML renderizado em PHP
- Manifest PWA, Swiper, LightGallery, SweetAlert2, inputmask, lozad, infinite-scroll, party-js

O que muda entre as duas lojas: **só configuração de painel** — logo, cor, fonte extra, Pixel do
Facebook (`952775063002612` vs `1918327085514434`) e quais blocos estão ligados.

> Conclusão: ninguém desenvolveu esses sites. É assinatura de SaaS, ~1h de configuração.

### Empório Body — Shopify com camada custom

| Camada | O que é |
|---|---|
| Plataforma | Shopify (`b9d7cb-3d.myshopify.com`, IP 23.227.38.65) |
| Tema | `Classic®` v8.0, `theme_store_id: null`, versionado em repo próprio (`EmporioShopify/master`) |
| Frontend custom | jQuery 3.6 + Migrate, Flickity, Ionicons, Font Awesome por CDN |
| Provador | Sizebay (`static.sizebay.technology`) |
| Checkout | **Yampi** (`api.dooki.com.br`, `globo_checkout.js`) + script custom redirecionando para `checkout.emporiobody.com.br` — subdomínio na **Vercel** |
| Tracking | GA4 `G-LG5KSXLHXV`, Google Ads `AW-17873361724`, Meta Pixel |
| Autoria | rodapé "Desenvolvido por mundoDev" |

**Sinais de manutenção reativa** encontrados no tema: `cart-debug.js`, `fix-cart-bug.js`,
`fix-cart-nan.js` — bug de carrinho remendado em camadas em vez de resolvido.

**Fragilidades apontadas:**

- Barra "Frete grátis para *sua cidade*" dependia de `myip.wtf/json` — serviço gratuito, sem SLA
- Calculadora de frete/rastreio chamando um **Google Apps Script** como API pública, sem rate limit
- `MutationObserver` escondendo botões nativos do Shopify — quebra a cada update do tema
- FacilZap: PHP 7.4 fora de suporte, `party-js@latest` sem pin, `user-scalable=no` (acessibilidade)

---

## 3. Transcrição das gravações de tela

Dois vídeos sem áudio, transcritos por extração de frames (`ffmpeg` a cada 2–3s + leitura visual).

### Vídeo 1 — 84s: as três lojas

Estrutura do catálogo FacilZap, de cima para baixo:

```
① Marquee de aviso          ⑧ Infinite scroll → "Sem mais produtos"
② Header sticky             ⑨ Faixa de 4 selos
③ Barra de busca            ⑩ Newsletter (nome + WhatsApp + e-mail)
④ Card de perfil da loja    ⑪ Rodapé 4 colunas
⑤ Categorias circulares     ⑫ "Loja virtual criada com FácilZap"
⑥ Filtrar / Destaque        + stories flutuante, prova social, PWA
⑦ Seções por categoria
```

Detalhes que denunciam o público atacadista na modal de produto:

1. **Stepper de quantidade por variação** (compra em grade, não tamanho único)
2. **Botão de download da imagem** — a revendedora baixa a foto para o próprio Instagram
3. Ficha técnica no texto (gramatura, composição), não copy emocional

### Vídeo 2 — 2min19s: Empório Body em profundidade

O que faltava: carrinho, regra de atacado e checkout.

- **Topbar dupla**: `FRETE GRÁTIS acima de R$ 399,90 (VAREJO)` | `ATACADO: PREÇO DE FÁBRICA ACIMA DE 12 PEÇAS VARIADAS`
- **Card com preço duplo** VAREJO | ATACADO — a coluna de atacado fica com um traço até o login
- **PDP**: lente de zoom, Provador Virtual + Tabela de Medidas (Sizebay, busto/cintura/quadril por tamanho)
- **Carrinho**: barra de progresso laranja *"Faltam 10 peças para atacado — 2/12 · Meta: 12 peças"*
- **Modal de política de troca** ao abrir o carrinho
- **Checkout** (Yampi em domínio próprio): "Carregando checkout…", 4 passos, PF/PJ, resumo com cupom, pop-up de cupom EMPORIO10

---

## 4. O modelo de negócio destilado

| | Florence / Florata | Empório Body |
|---|---|---|
| Como foi feito | SaaS configurado | Shopify + tema custom + freela |
| Código próprio | zero | Liquid + JS + checkout na Vercel |
| Checkout | WhatsApp | Yampi/Mercado Pago em domínio próprio |
| SEO | bloqueado (`noindex`) | indexável |
| Público | atacado B2B com login | **varejo e atacado no mesmo catálogo** |

**A escada de conversão do Empório Body** — o que foi replicado na Wolfie:

```
topbar anuncia a regra
   → card mostra que existe preço melhor (coluna bloqueada)
      → PDP reduz dúvida de tamanho e de prazo
         → carrinho gamifica: "faltam X peças" [▓▓░░░░ 2/12]
            → checkout captura e-mail/WhatsApp no passo 1
               → pop-up de cupom se ainda houver hesitação
```

---

## 5. Construção da loja Wolfie

**Stack:** HTML + CSS + JS puro. Sem framework, sem build, sem `node_modules`.
Única dependência externa: fontes do Google (Poppins + Playfair Display).

**Decisão:** não usar framework porque o site é estático, precisa rodar no GitHub Pages e
sobreviver a manutenção por qualquer pessoa que saiba HTML.

### Páginas

| Arquivo | Conteúdo |
|---|---|
| `index.html` | hero slideshow, categorias, vitrine com preço duplo, chamada de atacado |
| `colecao.html` | PLP com filtros, ordenação e contagem |
| `produto.html` | PDP com lupa, variações, tabela de medidas, frete, acordeões |
| `carrinho.html` | barra de progresso de atacado + modal de política |
| `checkout.html` | 4 passos, PF/PJ, resumo, cupom |
| `sobre.html` | institucional |
| `404.html` | erro na identidade da marca |

### Catálogo (linha real, informada pelo cliente)

| Produto | Cat. | Varejo | PIX (−5%) | Atacado (12+) | Parcelas |
|---|---|---|---|---|---|
| Body Basic | BODY | R$ 79,90 | R$ 75,91 | R$ 55,93 | 6x R$ 13,32 |
| Cropped Multiformas | CROPPED | ~~R$ 99,90~~ **R$ 69,90** | — | R$ 48,93 | 3x R$ 23,30 |
| Body com Recorte Quadrado | BODY | R$ 99,90 | R$ 94,91 | R$ 69,93 | 6x R$ 16,65 |
| Cropped Manguinha | CROPPED | R$ 74,90 | R$ 71,16 | R$ 52,43 | 6x R$ 12,48 |
| Body Costas Livres | BODY | R$ 94,90 | R$ 90,16 | R$ 66,43 | 6x R$ 15,82 |

> Os preços são estimativa de mercado, **não foram confirmados pelo cliente**. Estão centralizados
> em `CATALOG` no topo de `assets/js/app.js`.

### Regras implementadas

- **Atacado:** 12 peças variadas → todo o carrinho vira preço de fábrica (70% do varejo)
- **Frete grátis:** acima de R$ 399,90 no PAC
- **PIX:** 5% de desconto
- **Cupom `WOLFIE10`:** 10%, oferecido no checkout após 7s
- Carrinho em `localStorage` (`wolfie.cart`), compartilhado entre páginas

### Sobre o checkout

`checkout.html` é **fachada visual** — não processa pagamento, não tem backend, os passos 2–4 são só
indicadores. Isso é proposital: PCI-DSS, antifraude, conciliação e chargeback são exatamente o que
Yampi/Appmax resolvem. A tela serve de referência ou de casca para um checkout transparente.

---

## 6. Identidade visual

### Renomeação

`Wolfe Moda` → **`Wolfie`** em todo o projeto: logo, cupom (`WOLFIE10`), e-mail, chave do
localStorage, marca d'água dos placeholders, rodapé legal.

### Análise dos arquivos de logo

| Arquivo | Tom médio | Contraste em branco | Contraste em preto |
|---|---|---|---|
| Logo fundo transparente | `#f3e6da` pérola/rosé | **1,23:1** — some | **17,1:1** ✓ |
| Logo em branco perolado | idem, com fundo chapado | — | — |

**Conclusão:** o transparente é o correto para web, mas o logo foi desenhado para **fundo escuro** —
o que a própria ID visual da marca confirma (W + coração em pérola sobre preto sólido).

### Arquivos gerados em `assets/brand/`

| Arquivo | Uso |
|---|---|
| `icone-512/192/180/32.png` + `favicon.ico` | ícone do navegador e atalho de celular — a ID visual oficial |
| `wordmark-flat.png` | cabeçalho, rodapé, checkout — bronze sólido `#6b4636`, **7,7:1** |
| `logo-light.png` | lockup original pérola — só sobre fundo escuro |
| `logo-dark.png` | lockup metálico escurecido para fundo claro |
| `logo-flat.png`, `monograma.png` | tamanhos pequenos, impressão, selos |

> O bronze `#6b4636` foi **derivado** do pérola original (conversão HSV preservando matiz, reduzindo
> luminosidade e reforçando saturação). Não é cor oficial — se a designer produzir uma versão para
> fundo claro, basta substituir `wordmark-flat.png`.

### Incidente: logo estourando o cabeçalho

O HTML novo carregou com o `style.css` em cache, e sem as regras de tamanho as imagens renderizavam
no tamanho natural (640px e 192px). Duas defesas aplicadas:

1. **Cache busting** `?v=20260816` em todos os CSS e JS
2. **Dimensões de exibição nos `<img>`** (`width="86" height="30"`) — o logo fica correto mesmo sem
   CSS algum, e o espaço é reservado antes do carregamento (elimina layout shift)

Testado com o CSS bloqueado: 86×30 e 38×38, contra 640×222 e 192×192 antes.

---

## 7. Refinamento visual

Camada isolada (seção 20 do CSS + `initAtmosphere()`), removível sem tocar no resto.

**Gradientes de marca:** `--grad-brand` (verde→lima), `--grad-cta`, `--grad-warm` (pêssego→terracota),
`--grad-ink`.

**Atmosfera:** fundo com degradê sutil + dois halos radiais fixos; vinheta e brilho diagonal nas
fotos; máscara de fade nas pontas dos marquees; fio arco-íris com glow.

**Motion:** reveal no scroll com blur→nítido e stagger; header vira vidro fosco e encolhe; barra de
progresso de leitura; ken burns no hero; sheen nos botões; shimmer na barra de atacado; halo no
WhatsApp; spring nos modais.

**Funcionais:** lupa real com ampliação 2,4× (antes era um círculo decorativo) e crossfade para uma
segunda imagem no hover do card.

**Acessibilidade:** `focus-visible` em tudo, `prefers-reduced-motion` desliga as animações,
`@media print` revela o conteúdo.

---

## 8. Frete conectado

### Camada 1 — funcionando hoje, sem backend

Consulta de CEP em **BrasilAPI** com **ViaCEP** como reserva automática (timeout de 6s). As duas
liberam CORS, então rodam direto do navegador.

Cálculo por zona: UF → região + peso somado dos itens (campo `peso` no catálogo) + 50g de embalagem.

| Região | PAC (até 300g) | + a cada 300g | Prazo | SEDEX | Prazo |
|---|---|---|---|---|---|
| Goiás | R$ 12,90 | R$ 2,50 | 3–5 | R$ 21,90 | 1–2 |
| Centro-Oeste | R$ 16,90 | R$ 3,00 | 4–6 | R$ 27,90 | 2–3 |
| Sudeste | R$ 19,90 | R$ 3,50 | 5–8 | R$ 32,90 | 2–4 |
| Sul | R$ 22,90 | R$ 3,80 | 6–9 | R$ 36,90 | 3–5 |
| Nordeste | R$ 26,90 | R$ 4,20 | 8–13 | R$ 44,90 | 4–7 |
| Norte | R$ 32,90 | R$ 5,00 | 10–18 | R$ 54,90 | 5–9 |

Regras automáticas: frete grátis no PAC acima de R$ 399,90 e **retirada na fábrica** para Goiânia.

### Camada 2 — cotação real (opcional)

`api/frete.js` — função serverless para Vercel que consulta a **Melhor Envio**. Existe porque o token
não pode ficar no front e essas APIs não aceitam chamada do navegador. Se a API falhar, expirar ou
estourar o tempo, o site **volta sozinho para a tabela** — o cliente nunca vê erro.

Documentação completa em [`FRETE.md`](FRETE.md).

---

## 9. Auditoria e nível e-commerce

### Achados medidos

| Problema | Medição | Correção |
|---|---|---|
| CTA verde com texto branco | contraste **1,82:1** (AA = 4,5) | CTA primário **preto**, **18,9:1** |
| 3 `<h1>` na home | um por slide | apenas 1, os outros viraram `<p>` |
| Alvos de toque < 44px | 14 elementos | **0** — via `@media (hover:none)` |

### Novo sistema de cores de ação

| Papel | Cor | Regra |
|---|---|---|
| Ação primária | `#111` | tudo que é "comprar/avançar" |
| Economia | `#0b7a3d` | PIX, frete grátis, atacado liberado |
| Liquidação | `#d1354a` | badge de desconto, preço riscado |
| Sobre foto | branco | padrão editorial |

> O verde deixou de ser "clique aqui" e virou "você está economizando". Quando tudo é verde, nada
> comunica.

### Padrões de conversão adicionados (`assets/js/shop.js`)

- **Mini-carrinho em gaveta** ao adicionar, com duas metas em barra de progresso (frete grátis e preço de fábrica)
- **Barra fixa de compra** na PDP quando o botão sai da tela
- **Tamanho obrigatório** — sem escolher, o produto não entra na sacola
- **Filtros e ordenação funcionais** na vitrine, com contagem
- **Bloco de confiança** na PDP; aviso de estoque baixo **desligado por padrão** (só aparece se
  `estoque` for definido no catálogo — escassez inventada destrói recompra)
- **JSON-LD**: `OnlineStore`, `Product` com frete e devolução, `BreadcrumbList`, `ItemList`

### Performance

FCP **452ms → 360ms**. Removido o `filter: blur()` de um elemento fixo de tela cheia (forçava repaint
a cada scroll), `defer` nos scripts, peso 300 da Poppins removido do request, `content-visibility`
apenas nas seções de produto.

`content-visibility` no rodapé foi **testado e revertido** — deixava a página em branco em impressão
e captura. Ganho pequeno não paga risco de correção.

### Responsividade

| Largura | Cards/linha | Overflow |
|---|---|---|
| 360 / 390px | 2 | 0 |
| 768px | 3 | 0 |
| 1024px | 3 | 0 |
| 1440 / 1920px | 5 | 0 |

`env(safe-area-inset-bottom)` nas barras fixas, aba CUPOM some no mobile (zona do polegar),
container vai a 1440px em telas ≥1600px.

---

## 10. Estado atual

```
wolfie/
├── index.html · colecao.html · produto.html
├── carrinho.html · checkout.html · sobre.html · 404.html
├── assets/
│   ├── css/style.css        design system + refinamento + CRO (seções 1–24)
│   ├── js/app.js            catálogo, carrinho, efeitos, ícones SVG
│   ├── js/frete.js          CEP real + zonas + cotação opcional
│   ├── js/shop.js           mini-carrinho, barra fixa, filtros, validação
│   ├── brand/               logo e ícones oficiais processados
│   └── og.jpg               card de compartilhamento 1200×630
├── api/frete.js             função serverless (Vercel) — opcional
├── site.webmanifest · .nojekyll · .gitignore
└── README.md · CONTRIBUTING.md · FRETE.md · PROJETO.md
```

Pacote completo: **356 KB**. Zero erro de console nas 7 páginas.

### Fluxo validado ponta a ponta

Sem tamanho → bloqueia · com tamanho → gaveta abre com as metas · 5 peças → R$ 499,50 ·
12 peças → preço de fábrica R$ 839,16 · CEP 01310-100 → Avenida Paulista, PAC R$ 19,90 ·
cupom WOLFIE10 → R$ 449,55.

---

## 11. Pendências

**Bloqueiam o lançamento:**

- [ ] **Fotos reais** — hoje são placeholders de gradiente. É o maior ganho de conversão que falta.
- [ ] Confirmar a **tabela de preços** (os valores atuais são estimativa)
- [ ] Trocar `SEU-USUARIO.github.io` pela URL real (canonical / og:url / og:image)
- [ ] WhatsApp real no lugar de `5562984088708`
- [ ] CNPJ, endereço e e-mail de contato reais
- [ ] Handles de Facebook e TikTok (Instagram já aponta para `@usewolfie.br`)

**Depois:**

- [ ] Checkout de verdade (Yampi/Appmax) no `FINALIZAR COMPRA`
- [ ] Deploy da `api/frete.js` com token da transportadora
- [ ] GA4 + Meta Pixel se for rodar tráfego pago
- [ ] Capas de destaque do kit da marca (Novidades, Mais Vendidos, Tamanhos, Entregas, Feedbacks,
      Sobre Nós) nas categorias circulares da home
- [ ] Versão oficial do logo para fundo claro, se a designer produzir

---

## 12. Comandos úteis

Rodar local:

```bash
cd ~/Downloads/wolfie && python3 -m http.server 8080
```

Publicar no GitHub Pages: subir o conteúdo **da raiz** desta pasta e ativar
*Settings → Pages → Deploy from a branch → `main` / `(root)`*.

```bash
cd ~/Downloads/wolfie && git remote set-url origin https://github.com/SEU-USUARIO/SEU-REPO.git && git add -A && git commit -m "feat: loja Wolfie" && git push -u origin main
```

Testar o frete pelo console do navegador:

```js
await WolfieFrete.cotar({cep:'01310100', itens:[{id:'body-basic', qty:3}]})
```

Após qualquer alteração em CSS ou JS, incremente o `?v=` nos HTML para furar o cache.
