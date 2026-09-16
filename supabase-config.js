// Configuração do Supabase
// A chave anon/publishable é própria para uso no front-end quando o RLS está habilitado.
// Substitua os valores abaixo pelos dados do projeto PM no Supabase.
window.PM_SUPABASE_CONFIG = {
  url: 'COLE_AQUI_A_URL_DO_SUPABASE',
  anonKey: 'COLE_AQUI_A_CHAVE_ANON_DO_SUPABASE'
};

(function initSupabase() {
  const { url, anonKey } = window.PM_SUPABASE_CONFIG;
  const configured =
    url &&
    anonKey &&
    !url.startsWith('COLE_AQUI') &&
    !anonKey.startsWith('COLE_AQUI');

  window.PM_SUPABASE_CONFIGURED = Boolean(configured);

  if (!configured) {
    window.pmSupabase = null;
    console.warn(
      'Supabase ainda não configurado. Preencha supabase-config.js antes de usar esta branch.'
    );
    return;
  }

  window.pmSupabase = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
