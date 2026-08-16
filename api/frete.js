/* ==========================================================================
   WOLFIE — cotação real de frete (função serverless)
   --------------------------------------------------------------------------
   Por que existe: o token da transportadora NÃO pode ficar no front-end, e as
   APIs de cotação (Melhor Envio, Correios, Frenet) não liberam CORS para o
   navegador. Esta função fica no meio: recebe o pedido do site, consulta a
   transportadora com o token guardado em variável de ambiente e devolve as
   opções já normalizadas.

   Deploy (Vercel, grátis):
     1. vercel deploy         (esta pasta /api é detectada automaticamente)
     2. Settings → Environment Variables:
          MELHOR_ENVIO_TOKEN = <seu token>
          MELHOR_ENVIO_ENV   = producao | sandbox      (padrão: sandbox)
          CORS_ORIGIN        = https://seu-dominio.com (padrão: *)
     3. No HTML da loja, antes de frete.js:
          <script>window.WOLFIE_FRETE_API='https://SEU-PROJETO.vercel.app/api/frete'</script>

   Sem a variável de ambiente configurada, a função responde 200 com
   {opcoes: []} — e o front cai sozinho na tabela de zonas. Nada quebra.
   ========================================================================== */

const ENDPOINTS = {
  sandbox:  'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
  producao: 'https://melhorenvio.com.br/api/v2/me/shipment/calculate'
};

/* dimensões médias da caixa por faixa de peso (cm) — ajuste conforme sua embalagem */
function caixaPara(pesoKg){
  if (pesoKg <= 0.5) return {altura: 4,  largura: 20, comprimento: 26};
  if (pesoKg <= 1.5) return {altura: 8,  largura: 25, comprimento: 32};
  if (pesoKg <= 4)   return {altura: 14, largura: 30, comprimento: 38};
  return               {altura: 22, largura: 36, comprimento: 45};
}

export default async function handler(req, res) {
  const origin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=600');   // 10 min por CEP/peso

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({erro: 'Use POST'});

  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return res.status(200).json({opcoes: [], motivo: 'token não configurado'});

  try {
    const { cepOrigem, cepDestino, pesoKg = 0.3, subtotal = 0 } = req.body || {};
    const so = String(cepOrigem  || '').replace(/\D/g, '');
    const sd = String(cepDestino || '').replace(/\D/g, '');
    if (so.length !== 8 || sd.length !== 8) {
      return res.status(400).json({erro: 'CEP de origem ou destino inválido'});
    }

    const peso = Math.max(0.1, Number(pesoKg));
    const url  = ENDPOINTS[process.env.MELHOR_ENVIO_ENV === 'producao' ? 'producao' : 'sandbox'];

    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Wolfie (contato@wolfie.com.br)'   // exigido pela API
      },
      body: JSON.stringify({
        from: {postal_code: so},
        to:   {postal_code: sd},
        package: {weight: peso, ...caixaPara(peso)},
        options: {insurance_value: Number(subtotal) || 0, receipt: false, own_hand: false}
      })
    });

    if (!resposta.ok) {
      return res.status(200).json({opcoes: [], motivo: `transportadora respondeu ${resposta.status}`});
    }

    const bruto = await resposta.json();

    const opcoes = (Array.isArray(bruto) ? bruto : [])
      .filter(s => !s.error && s.price)
      .map(s => ({
        id: String(s.id),
        nome: s.name,
        transportadora: s.company?.name || 'Transportadora',
        preco: Number(s.custom_price ?? s.price),
        prazoMin: Number(s.delivery_range?.min ?? s.delivery_time ?? 0),
        prazoMax: Number(s.delivery_range?.max ?? s.delivery_time ?? 0)
      }))
      .sort((a, b) => a.preco - b.preco)
      .slice(0, 4);

    return res.status(200).json({opcoes, fonte: 'melhor-envio'});
  } catch (e) {
    // nunca derruba a loja: front cai na tabela de zonas
    return res.status(200).json({opcoes: [], motivo: 'falha na consulta'});
  }
}
