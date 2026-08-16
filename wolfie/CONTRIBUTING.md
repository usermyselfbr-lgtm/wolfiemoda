# Como mexer neste projeto

Não há build. Edite os arquivos e recarregue o navegador.

## Onde mudar cada coisa

| Quero mudar | Arquivo |
|---|---|
| Cores, sombras, gradientes | `assets/css/style.css` → bloco `:root` (base) e `:root` da seção 20 (gradientes de marca) |
| Preços, produtos, regra de atacado, cupom | `assets/js/app.js` → topo (`CATALOG`, `META_ATACADO`, `FRETE_GRATIS`, `CUPOM`) |
| Textos e blocos da home | `index.html` |
| Ícones | `assets/js/app.js` → mapa `ICONS`, usado via `data-ic="nome"` |
| Efeitos de scroll, header, lupa | `assets/js/app.js` → `initAtmosphere()` e `initGallery()` |

## Antes de publicar uma alteração

1. Abra as 6 páginas e confira o console (deve estar limpo).
2. Teste o fluxo: produto → adicionar 12 peças → carrinho (barra fica verde) → checkout (cupom aplica).
3. Teste em 390px de largura (mobile) e com `prefers-reduced-motion` ligado.

## Convenção de commits

`feat:` novidade · `fix:` correção · `style:` visual · `content:` textos e produtos · `docs:` documentação
