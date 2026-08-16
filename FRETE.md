# Frete — como funciona e como ligar na transportadora

## Em duas camadas

```
        ┌──────────────────────── navegador (site estático) ────────────────────────┐
CEP ──▶ │ 1. BrasilAPI  ──falhou?──▶ ViaCEP        → endereço real (UF, cidade…)    │
        │ 2. FRETE_API configurada? ──sim──▶ /api/frete ──▶ Melhor Envio (cotação)  │
        │                            └──não/erro──▶ tabela de zonas (UF + peso)     │
        └───────────────────────────────────────────────────────────────────────────┘
```

A **camada 1 já está conectada e funcionando** — as duas APIs de CEP são públicas, gratuitas e
liberam CORS. A **camada 2 é opcional**: sem ela, o preço vem da tabela de zonas; com ela, vem
da transportadora de verdade.

---

## Camada 1 — o que já roda hoje

**Consulta de CEP:** `BrasilAPI` (`brasilapi.com.br/api/cep/v2/`) com `ViaCEP` como reserva. Se a
primeira falhar ou demorar mais de 6 s, cai automaticamente na segunda. Retorna rua, bairro,
cidade e UF reais — é o que aparece no topo do resultado.

**Cálculo:** UF → região → tabela de preço/prazo, mais o peso somado dos itens da sacola.

| Região | PAC (até 300 g) | + a cada 300 g | Prazo PAC | SEDEX | Prazo SEDEX |
|---|---|---|---|---|---|
| Goiás | R$ 12,90 | R$ 2,50 | 3–5 dias | R$ 21,90 | 1–2 dias |
| Centro-Oeste | R$ 16,90 | R$ 3,00 | 4–6 | R$ 27,90 | 2–3 |
| Sudeste | R$ 19,90 | R$ 3,50 | 5–8 | R$ 32,90 | 2–4 |
| Sul | R$ 22,90 | R$ 3,80 | 6–9 | R$ 36,90 | 3–5 |
| Nordeste | R$ 26,90 | R$ 4,20 | 8–13 | R$ 44,90 | 4–7 |
| Norte | R$ 32,90 | R$ 5,00 | 10–18 | R$ 54,90 | 5–9 |

**Regras aplicadas automaticamente**
- Pedido ≥ **R$ 399,90** → PAC fica **grátis** (mostra o valor cheio riscado ao lado).
- CEP de **Goiânia** → aparece a opção **Retirar na fábrica**, grátis.
- Peso = soma do campo `peso` de cada peça no `CATALOG` + 50 g de embalagem.
- O CEP fica salvo em `localStorage` (`wolfie.cep`) e vem preenchido na próxima visita.

Tudo isso está em `assets/js/frete.js` — as constantes de configuração ficam no topo do arquivo
(`CEP_ORIGEM`, `FRETE_GRATIS_A_PARTIR`, `TABELA`, `REGIOES`).

---

## Camada 2 — cotação real (Melhor Envio)

O token da transportadora **não pode ficar no front-end** (qualquer pessoa leria no código) e as
APIs de cotação não aceitam chamada direta do navegador (sem CORS). Por isso existe
`api/frete.js`: uma função serverless que guarda o token e faz a ponte.

### Passo a passo

1. Crie a conta e gere o token em **melhorenvio.com.br** (Integrações → Tokens).
2. Nesta pasta, rode:
   ```bash
   npx vercel deploy --prod
   ```
   A pasta `api/` é reconhecida automaticamente pela Vercel.
3. Em **Settings → Environment Variables** do projeto:
   | Variável | Valor |
   |---|---|
   | `MELHOR_ENVIO_TOKEN` | seu token |
   | `MELHOR_ENVIO_ENV` | `sandbox` para testar, `producao` para valer |
   | `CORS_ORIGIN` | a URL da loja (ex.: `https://usewolfie.com.br`) |
4. Nos HTML da loja (`produto.html` e `carrinho.html`), antes do `frete.js`:
   ```html
   <script>window.WOLFIE_FRETE_API = 'https://SEU-PROJETO.vercel.app/api/frete'</script>
   ```

Pronto. O rodapé do resultado passa a dizer **"cotação da transportadora"** em vez de
"tabela Wolfie". Se a API cair, estourar o tempo ou o token expirar, o site **volta sozinho para a
tabela** — o cliente nunca vê erro.

### Ajustar a caixa

A função manda dimensões estimadas por faixa de peso (`caixaPara()` em `api/frete.js`).
Troque pelos valores da sua embalagem real — isso muda o preço cobrado pelos Correios,
que consideram peso cubado.

---

## Alternativas à Melhor Envio

| Serviço | Observação |
|---|---|
| **Correios (API oficial)** | exige contrato e usuário/senha; a antiga `CalcPrecoPrazo` foi descontinuada. Mesma função serve — só troque o `fetch` interno. |
| **Frenet** | token no header, resposta parecida; é trocar o endpoint e o mapeamento em `api/frete.js`. |
| **Kangu / Envia.com** | agregadores com transportadoras regionais, úteis para atacado com volume. |

Em todos os casos o front não muda: a função só precisa devolver
`{opcoes:[{id, nome, transportadora, preco, prazoMin, prazoMax}]}`.

---

## Testar sem deploy

No console do navegador, em qualquer página da loja:

```js
await WolfieFrete.cotar({cep:'01310100', itens:[{id:'body-basic', qty:3}]})
```

Devolve o objeto completo com endereço, peso, região e opções.
