// Assistente educacional — Meu Pequeno Mundo.
// No Cloudflare Workers, configure o Secret OPENAI_API_KEY e a variável ALLOWED_ORIGIN.
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const permitted = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
    const cors = {
      'Access-Control-Allow-Origin': permitted,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
    };
    const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
    if (!permitted || origin !== permitted) return new Response('Origem não autorizada', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: 'Método não permitido' });
    if (!env.OPENAI_API_KEY) return json(503, { error: 'IA não configurada' });
    if (Number(request.headers.get('Content-Length') || 0) > 8000) return json(413, { error: 'Mensagem muito grande' });
    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'Formato inválido' }); }
    const question = String(body.question || '').trim().slice(0, 500);
    const topic = String(body.topic || '').trim().slice(0, 100);
    const rawAge = body.ageMonths;
    const ageMonths = Number.isInteger(rawAge) && rawAge >= 0 && rawAge <= 216 ? rawAge : null;
    if (!question && !topic) return json(400, { error: 'Informe uma pergunta' });
    const instructions = `Você é um assistente educativo para pais e responsáveis por bebês e crianças, em português brasileiro. Dê respostas práticas, simples, gentis e adequadas à idade informada; se a idade não for informada, evite instruções específicas à idade e peça essa informação quando realmente necessário. Priorize interação presencial, segurança, brincadeiras e educação. Em assuntos de saúde: não diagnostique, não prescreva doses, remédios, dietas terapêuticas, nem substitua profissionais. Para sinais de alarme ou risco imediato (dificuldade respiratória, inconsciência, convulsão, engasgo), oriente procurar atendimento de urgência imediatamente e serviços locais. Recomende sono seguro: bebês de barriga para cima, superfície firme e sem objetos soltos. Para alimentação, destaque risco de engasgo e diretrizes de acordo com a idade; não recomende mel antes de 12 meses. Não solicite dados pessoais identificáveis da criança. Se o pedido não tiver relação com infância ou cuidados, redirecione educadamente. Seja breve (até 180 palavras).`;
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-4.1-mini', instructions,
          input: `Assunto: ${topic || 'Cuidados infantis'}\nIdade em meses: ${ageMonths === null ? 'não informada' : ageMonths}\nPergunta: ${question || topic}`,
          max_output_tokens: 420, store: false }),
      });
      if (!response.ok) return json(502, { error: 'Serviço de IA indisponível' });
      const payload = await response.json();
      const answer = payload.output_text || (payload.output || []).flatMap(o => o.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n');
      if (!answer) return json(502, { error: 'Resposta indisponível' });
      return json(200, { answer: String(answer).slice(0, 4000) });
    } catch { return json(502, { error: 'Falha temporária de conexão' }); }
  }
};
