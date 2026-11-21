/**
 * Meu Pequeno Mundo — busca infantil YouTube Data API v3.
 * Publique como Cloudflare Worker e configure os secrets YOUTUBE_API_KEY e ALLOWED_ORIGIN.
 * Para produção: habilite rate limiting no Cloudflare e autenticação da área administrativa.
 */
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
    const originOK = !!allowed && origin === allowed;
    const headers = {
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'public, max-age=300',
      'Vary':'Origin',
      ...(originOK ? {'Access-Control-Allow-Origin':origin} : {})
    };
    const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept'}});
    if(request.method!=='GET') return reply({error:'Método não permitido.'},405);
    if(!originOK)return reply({error:'Origem não autorizada.'},403);
    if(!env.YOUTUBE_API_KEY) return reply({error:'Pesquisa não configurada.'},503);
    const u=new URL(request.url);
    const q=String(u.searchParams.get('q')||'').trim().slice(0,100);
    const category=u.searchParams.get('category')==='music'?'music':'video';
    const pageToken=String(u.searchParams.get('pageToken')||'').trim();
    if(q.length<2)return reply({error:'Digite pelo menos duas letras.'},400);
    if(pageToken && !/^[a-zA-Z0-9_-]{1,160}$/.test(pageToken))return reply({error:'Página inválida.'},400);
    // A busca é direcionada a temas infantis, mas exige supervisão e curadoria do responsável.
    const query = category==='music' ? `${q} infantil bebê música` : `${q} infantil crianças educativo`;
    const params=new URLSearchParams({part:'snippet',type:'video',q:query,maxResults:'12',safeSearch:'strict',videoEmbeddable:'true',relevanceLanguage:'pt',regionCode:'BR',key:env.YOUTUBE_API_KEY});
    if(pageToken)params.set('pageToken',pageToken);
    try{
      const resp=await fetch('https://www.googleapis.com/youtube/v3/search?'+params.toString());
      const json=await resp.json();
      if(!resp.ok){
        const msg=resp.status===403?'Limite de pesquisas atingido ou API não autorizada.':'Pesquisa temporariamente indisponível.';
        return reply({error:msg},resp.status===403?429:502);
      }
      const items=(json.items||[]).map(x=>({id:x.id?.videoId,title:x.snippet?.title||'',channel:x.snippet?.channelTitle||''})).filter(x=>/^[\w-]{11}$/.test(x.id||''));
      return reply({items,nextPageToken:json.nextPageToken||''});
    }catch{return reply({error:'Não foi possível acessar o YouTube.'},502)}
  }
};
