document.addEventListener('DOMContentLoaded', async () => {
  const auth = await window.pmAuthReady;
  if (!auth.authenticated) return;

  const board = document.getElementById('kanban-board');
  const weekDates = document.getElementById('weekDates');
  const prevWeekBtn = document.getElementById('prevWeek');
  const nextWeekBtn = document.getElementById('nextWeek');
  const openModalBtn = document.getElementById('openModalBtn');
  const modal = document.getElementById('addCardModal');
  const closeBtn = modal.querySelector('.close-btn');
  const form = document.getElementById('agendamentoForm');
  const formMessage = document.getElementById('agendaFormMessage');

  let currentWeekStart = startOfWeek(new Date());

  function startOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function toIsoDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  function normalizeType(type) {
    return (type || 'prova')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('nomeCliente').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    formMessage.textContent = '';
  }

  function renderWeekSkeleton() {
    board.replaceChildren();
    const week = [];

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      week.push(day);

      const column = document.createElement('section');
      column.className = 'day-column';
      column.dataset.date = toIsoDate(day);

      const header = document.createElement('div');
      header.className = 'day-header';
      header.textContent = `${day
        .toLocaleDateString('pt-BR', { weekday: 'long' })
        .replace(/^./, (char) => char.toUpperCase())} - ${day.getDate()}`;

      const list = document.createElement('div');
      list.className = 'day-list';

      column.append(header, list);
      board.appendChild(column);
    }

    weekDates.textContent = `${formatDate(week[0])} - ${formatDate(week[6])}`;
    return week;
  }

  function createCard(item) {
    const card = document.createElement('article');
    card.className = `card card-${normalizeType(item.tipo)}`;

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = `${item.tipo} - ${item.nome || 'Sem nome'}`;

    const body = document.createElement('div');
    body.className = 'card-body';

    const time = document.createElement('div');
    time.textContent = `Horário: ${item.hora ? item.hora.slice(0, 5) : 'N/A'}`;

    const receipt = document.createElement('div');
    receipt.textContent = item.reciboNumero
      ? `Recibo: ${item.reciboNumero}`
      : 'Agendamento avulso';

    body.append(time, receipt);
    card.append(title, body);
    return card;
  }

  async function loadAppointments() {
    const week = renderWeekSkeleton();
    const start = toIsoDate(week[0]);
    const end = toIsoDate(week[6]);

    try {
      const appointments = await window.PMData.listAgendaBetween(start, end);

      for (const item of appointments) {
        const column = board.querySelector(`[data-date="${item.data}"] .day-list`);
        if (column) column.appendChild(createCard(item));
      }

      board.querySelectorAll('.day-list').forEach((list) => {
        if (!list.children.length) {
          const empty = document.createElement('p');
          empty.className = 'day-empty';
          empty.textContent = 'Sem agendamentos';
          list.appendChild(empty);
        }
      });
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      const errorBox = document.createElement('p');
      errorBox.className = 'error-state';
      errorBox.textContent = 'Não foi possível carregar a agenda.';
      board.replaceChildren(errorBox);
    }
  }

  openModalBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  window.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      nome_cliente: document.getElementById('nomeCliente').value.trim(),
      tipo: document.getElementById('tipoAtendimento').value,
      data: document.getElementById('dataAtendimento').value,
      hora: document.getElementById('horaAtendimento').value
    };

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Salvando...';

    try {
      await window.PMData.createAgendamento(payload);
      form.reset();
      closeModal();
      await loadAppointments();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      formMessage.textContent = 'Não foi possível salvar o agendamento.';
      formMessage.className = 'form-message error';
    } finally {
      button.disabled = false;
      button.textContent = 'Salvar';
    }
  });

  prevWeekBtn.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadAppointments();
  });

  nextWeekBtn.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadAppointments();
  });

  await loadAppointments();
});
