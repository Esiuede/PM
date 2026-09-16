document.addEventListener('DOMContentLoaded', async () => {
  const auth = await window.pmAuthReady;
  if (!auth.authenticated) return;

  const tableBody = document.querySelector('#contasReceberTable tbody');
  const modal = document.getElementById('contaModal');
  const pixModal = document.getElementById('pixModal');
  const addContaBtn = document.getElementById('addContaBtn');
  const openPixModalBtn = document.getElementById('openPixModalBtn');
  const closeContaBtn = modal.querySelector('.close-btn');
  const closePixBtn = pixModal.querySelector('.close-btn');
  const form = document.getElementById('contaForm');
  const modalTitle = document.getElementById('modalTitle');
  const valorInput = document.getElementById('valor');
  const feedback = document.getElementById('tableFeedback');
  let contas = [];

  const currencyMask = IMask(valorInput, {
    mask: 'R$ num',
    blocks: {
      num: {
        mask: Number,
        scale: 2,
        radix: ',',
        mapToRadix: ['.'],
        thousandsSeparator: '.',
        padFractionalZeros: true,
        min: 0
      }
    }
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);

  const formatDate = (value) =>
    value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : 'N/A';

  function statusClass(status) {
    return (status || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  function openModal(conta = null) {
    form.reset();
    currencyMask.value = '';
    document.getElementById('contaId').value = '';

    if (conta) {
      modalTitle.textContent = 'Editar Conta a Receber';
      document.getElementById('contaId').value = conta.id;
      document.getElementById('vencimento').value = conta.vencimento || '';
      document.getElementById('cliente').value = conta.cliente || '';
      currencyMask.value = String(conta.valor || 0).replace('.', ',');
      document.getElementById('descricao').value = conta.descricao || '';
      document.getElementById('status').value = conta.status || 'A receber';

      const linkedNotice = document.getElementById('linkedReceiptNotice');
      if (conta.recibo_id) {
        linkedNotice.hidden = false;
        linkedNotice.textContent =
          'Esta conta foi gerada por um recibo. Alterações financeiras do recibo sincronizam este título.';
      } else {
        linkedNotice.hidden = true;
      }
    } else {
      modalTitle.textContent = 'Adicionar Nova Conta a Receber';
      document.getElementById('linkedReceiptNotice').hidden = true;
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openPixModal() {
    pixModal.classList.add('is-open');
    pixModal.setAttribute('aria-hidden', 'false');
  }

  function closePixModal() {
    pixModal.classList.remove('is-open');
    pixModal.setAttribute('aria-hidden', 'true');
  }

  function addCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '';
    row.appendChild(cell);
  }

  function render() {
    tableBody.replaceChildren();

    if (!contas.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.className = 'table-empty';
      cell.textContent = 'Nenhuma conta a receber encontrada.';
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    for (const conta of contas) {
      const row = document.createElement('tr');
      row.className = `status-${statusClass(conta.status)}`;

      addCell(row, formatDate(conta.vencimento));
      addCell(row, conta.cliente || '');
      addCell(row, conta.descricao || '');
      addCell(row, formatCurrency(conta.valor));

      const statusCell = document.createElement('td');
      const tag = document.createElement('span');
      tag.className = 'status-tag';
      tag.textContent = conta.status || 'N/A';
      statusCell.appendChild(tag);
      row.appendChild(statusCell);

      const actions = document.createElement('td');
      actions.className = 'actions-cell';

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'action-btn edit-btn';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => openModal(conta));

      actions.appendChild(edit);
      row.appendChild(actions);
      tableBody.appendChild(row);
    }
  }

  async function load() {
    try {
      contas = await window.PMData.listContasReceber();
      render();
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      tableBody.innerHTML =
        '<tr><td colspan="6" class="table-empty error-state">Não foi possível carregar as contas.</td></tr>';
    }
  }

  addContaBtn.addEventListener('click', () => openModal());
  openPixModalBtn.addEventListener('click', openPixModal);
  closeContaBtn.addEventListener('click', closeModal);
  closePixBtn.addEventListener('click', closePixModal);

  window.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
    if (event.target === pixModal) closePixModal();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('contaId').value || null;
    const original = id ? contas.find((item) => item.id === id) : null;

    const payload = {
      vencimento: document.getElementById('vencimento').value,
      cliente: document.getElementById('cliente').value.trim(),
      valor: Number(currencyMask.unmaskedValue) || 0,
      descricao: document.getElementById('descricao').value.trim() || null,
      status: document.getElementById('status').value,
      recibo_id: original?.recibo_id || null
    };

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Salvando...';

    try {
      await window.PMData.saveContaReceber(id, payload);
      closeModal();
      await load();
      feedback.textContent = 'Conta salva com sucesso.';
      feedback.className = 'inline-feedback success';
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      feedback.textContent = 'Não foi possível salvar a conta.';
      feedback.className = 'inline-feedback error';
    } finally {
      button.disabled = false;
      button.textContent = 'Salvar';
    }
  });

  await load();
});
