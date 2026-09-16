document.addEventListener('DOMContentLoaded', async () => {
  const auth = await window.pmAuthReady;
  if (!auth.authenticated) return;

  const agendaContainer = document.getElementById('agendaDoDia');
  const recibosContainer = document.getElementById('ultimosRecibos');

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  function normalizeType(type) {
    return (type || 'prova')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  function createAppointmentCard(item) {
    const card = document.createElement('div');
    card.className = `appointment-card card-${normalizeType(item.tipo)}`;

    const time = document.createElement('div');
    time.className = 'appointment-time';
    time.textContent = item.hora ? item.hora.slice(0, 5) : '--:--';

    const details = document.createElement('div');
    details.className = 'appointment-details';

    const title = document.createElement('div');
    title.className = 'appointment-title';
    title.textContent = item.tipo;

    const patient = document.createElement('div');
    patient.className = 'appointment-patient';
    patient.textContent = item.nome || 'Sem nome';

    details.append(title, patient);
    card.append(time, details);
    return card;
  }

  function createReceiptItem(recibo) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'receipt-item receipt-item-button';

    const info = document.createElement('span');
    info.className = 'receipt-info';

    const number = document.createElement('span');
    number.className = 'receipt-number';
    number.textContent = `Recibo Nº ${recibo.numero}`;

    const patient = document.createElement('span');
    patient.className = 'receipt-patient';
    patient.textContent = recibo.nome || 'Sem nome';

    const action = document.createElement('span');
    action.className = 'receipt-open';
    action.textContent = 'Ver';

    info.append(number, patient);
    item.append(info, action);

    item.addEventListener('click', () => {
      window.location.href = `cadastro.html?id=${encodeURIComponent(recibo.id)}`;
    });

    return item;
  }

  try {
    const [agenda, recibos] = await Promise.all([
      window.PMData.listAgendaForDate(todayString),
      window.PMData.listRecentRecibos(5)
    ]);

    agendaContainer.replaceChildren();
    if (!agenda.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum agendamento para hoje.';
      agendaContainer.appendChild(empty);
    } else {
      agenda.forEach((item) => agendaContainer.appendChild(createAppointmentCard(item)));
    }

    recibosContainer.replaceChildren();
    if (!recibos.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum recibo cadastrado.';
      recibosContainer.appendChild(empty);
    } else {
      recibos.forEach((recibo) => recibosContainer.appendChild(createReceiptItem(recibo)));
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);

    agendaContainer.textContent = 'Não foi possível carregar a agenda.';
    agendaContainer.classList.add('error-state');

    recibosContainer.textContent = 'Não foi possível carregar os recibos.';
    recibosContainer.classList.add('error-state');
  }
});
