document.addEventListener('DOMContentLoaded', async () => {
  const auth = await window.pmAuthReady;
  if (!auth.authenticated) return;

  const tableBody = document.querySelector('#contasPagarTable tbody');
  const modal = document.getElementById('contaModal');
  const addContaBtn = document.getElementById('addContaBtn');
  const closeBtn = modal.querySelector('.close-btn');
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

  function openModal(conta = null) {
    form.reset();
    currencyMask.value = '';
    document.getElementById('contaId').value = '';

    if (conta) {
      modalTitle.textContent = 'Editar Conta a Pagar';
      document.getElementById('contaId').value = conta.id;
      document.getElementById('vencimento').value = conta.vencimento || '';
      document.getElementById('fornecedor').value = conta.fornecedor || '';
      currencyMask.value = String(conta.valor || 0).replace('.', ',');
      document.getElementById('descricao').value = conta.descricao || '';
      document.getElementById('categoria').value = conta.categoria || 'Fornecedores';
      document.getElementById('formaPagamento').value =
        conta.forma_pagamento || 'Boleto';
      document.getElementById('status').value = conta.status || 'A pagar';
    } else {
      modalTitle.textContent = 'Adicionar Nova Conta a Pagar';
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function statusClass(status) {
    return (status || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
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
      cell.textContent = 'Nenhuma conta a pagar encontrada.';
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    for (const conta of contas) {
      const row = document.createElement('tr');
      row.className = `status-${statusClass(conta.status)}`;

      addCell(row, formatDate(conta.vencimento));
      addCell(row, conta.fornecedor || '');
      addCell(row, formatCurrency(conta.valor));
      addCell(row, conta.categoria || '');

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

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'action-btn delete-btn';
      del.textContent = 'Excluir';
      del.addEventListener('click', async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
        del.disabled = true;
        try {
          await window.PMData.deleteContaPagar(conta.id);
          contas = contas.filter((item) => item.id !== conta.id);
          render();
          feedback.textContent = 'Conta excluída com sucesso.';
          feedback.className = 'inline-feedback success';
        } catch (error) {
          console.error('Erro ao excluir conta:', error);
          feedback.textContent = 'Não foi possível excluir a conta.';
          feedback.className = 'inline-feedback error';
          del.disabled = false;
        }
      });

      actions.append(edit, del);
      row.appendChild(actions);
      tableBody.appendChild(row);
    }
  }

  async function load() {
    try {
      contas = await window.PMData.listContasPagar();
      render();
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      tableBody.innerHTML =
        '<tr><td colspan="6" class="table-empty error-state">Não foi possível carregar as contas.</td></tr>';
    }
  }

  addContaBtn.addEventListener('click', () => openModal());
  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('contaId').value || null;
    const payload = {
      vencimento: document.getElementById('vencimento').value,
      fornecedor: document.getElementById('fornecedor').value.trim(),
      valor: Number(currencyMask.unmaskedValue) || 0,
      descricao: document.getElementById('descricao').value.trim() || null,
      categoria: document.getElementById('categoria').value,
      forma_pagamento: document.getElementById('formaPagamento').value,
      status: document.getElementById('status').value
    };

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Salvando...';

    try {
      await window.PMData.saveContaPagar(id, payload);
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
