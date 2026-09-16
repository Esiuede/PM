// Configuração do Supabase
// A chave anon/publishable é própria para uso no front-end quando o RLS está habilitado.
// Substitua os valores abaixo pelos dados do projeto PM no Supabase.
window.PM_SUPABASE_CONFIG = {
  url: 'https://errvcosgvzzgkceawbcc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnZjb3Nndnp6Z2tjZWF3YmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MTg4NjIsImV4cCI6MjEwNTA5NDg2Mn0.gXlgJzfBHLyyqgHMcqzDKuGjCEALmnLxkrXEEhojtP4'
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
