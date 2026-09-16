document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('login');
  const passwordInput = document.getElementById('senha');
  const errorEl = document.getElementById('erro');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!window.PM_SUPABASE_CONFIGURED || !window.pmSupabase) {
    errorEl.textContent =
      'Supabase ainda não configurado. Preencha supabase-config.js para ativar o login.';
    submitButton.disabled = true;
    return;
  }

  const { data } = await window.pmSupabase.auth.getSession();
  if (data.session) {
    window.location.replace('menu.html');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const { error } = await window.pmSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      window.location.replace('menu.html');
    } catch (error) {
      console.error('Erro de login:', error);
      errorEl.textContent = 'E-mail ou senha incorretos.';
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });
});
