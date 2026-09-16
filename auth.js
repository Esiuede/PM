(function setupAuthGuard() {
  function waitForDom() {
    if (document.readyState !== 'loading') return Promise.resolve();
    return new Promise((resolve) =>
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    );
  }

  function injectLogoutButton() {
    const navList = document.querySelector('.nav-list');
    if (!navList || document.getElementById('logoutBtn')) return;

    const item = document.createElement('li');
    item.className = 'nav-item nav-item-logout';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'logoutBtn';
    button.className = 'nav-link nav-button';
    button.innerHTML = '<span class="nav-icon">↪</span> Sair';

    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await window.pmSupabase?.auth.signOut();
      } finally {
        window.location.replace('index.html');
      }
    });

    item.appendChild(button);
    navList.appendChild(item);
  }

  window.pmAuthReady = (async () => {
    await waitForDom();

    if (!window.PM_SUPABASE_CONFIGURED || !window.pmSupabase) {
      const main = document.querySelector('.main-content');
      if (main) {
        const notice = document.createElement('div');
        notice.className = 'config-warning';
        notice.textContent =
          'Supabase ainda não configurado nesta branch. Preencha supabase-config.js para testar.';
        main.prepend(notice);
      }
      return { authenticated: false, configured: false };
    }

    const { data, error } = await window.pmSupabase.auth.getSession();

    if (error) {
      console.error('Erro ao verificar sessão:', error);
      window.location.replace('index.html');
      return { authenticated: false, configured: true };
    }

    if (!data.session) {
      window.location.replace('index.html');
      return { authenticated: false, configured: true };
    }

    injectLogoutButton();
    return {
      authenticated: true,
      configured: true,
      session: data.session
    };
  })();
})();
