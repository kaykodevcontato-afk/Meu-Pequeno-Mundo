// Configurações do proprietário. Não insira chaves secretas aqui.
// Para pesquisar DENTRO do site, configure UM dos dois métodos:
// (1) Melhor: servidor HTTPS próprio que consulte o YouTube com chave secreta.
// (2) Simples: chave da YouTube Data API v3 RESTRITA ao domínio do site e à API.
// Chaves no JavaScript público podem ser vistas por visitantes.
window.MPM_CONFIG = {
  aiEndpoint: '',
  youtubeSearchEndpoint: '', // Exemplo: 'https://seu-servidor.example/api/youtube'
  youtubeApiKey: 'AIzaSyB4uqoXc2bXX8LQxt2uEn8_mcFa3U4cvns' // Chave pública RESTRITA por referer e API.
};
