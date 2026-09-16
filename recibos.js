document.addEventListener('DOMContentLoaded', async () => {
  const auth = await window.pmAuthReady;
  if (!auth.authenticated) return;

  const tableBody = document.querySelector('#recibosTable tbody');
  const filterInput = document.getElementById('filtroNome');
  const feedback = document.getElementById('tableFeedback');
  let recibos = [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);

  function addCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '';
    row.appendChild(cell);
  }

  function renderEmpty(message, className = 'table-empty') {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 9;
    cell.className = className;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.replaceChildren(row);
  }

  function render(list) {
    tableBody.replaceChildren();

    if (!list.length) {
      renderEmpty('Nenhum recibo encontrado.');
      return;
    }

    for (const recibo of list) {
      const row = document.createElement('tr');

      addCell(row, `Nº ${recibo.numero}`);
      addCell(row, recibo.nome || 'N/A');
      addCell(row, recibo.contato || 'N/A');
      addCell(row, recibo.material || 'N/A');
      addCell(row, formatCurrency(recibo.valor_total));
      addCell(row, formatCurrency(recibo.valor_entrada));
      addCell(row, formatCurrency(recibo.valor_restante));
      addCell(row, recibo.tipo_pagamento || 'N/A');

      const actionCell = document.createElement('td');
      actionCell.className = 'actions-cell';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'action-btn edit-btn';
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', () => {
        window.location.href = `cadastro.html?id=${encodeURIComponent(recibo.id)}`;
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'action-btn delete-btn';
      deleteButton.textContent = 'Excluir';
      deleteButton.addEventListener('click', async () => {
        if (!window.confirm(`Excluir o recibo Nº ${recibo.numero}?`)) return;

        deleteButton.disabled = true;
        try {
          await window.PMData.deleteRecibo(recibo.id);
          recibos = recibos.filter((item) => item.id !== recibo.id);
          applyFilter();
          feedback.textContent = 'Recibo excluído com sucesso.';
          feedback.className = 'inline-feedback success';
        } catch (error) {
          console.error('Erro ao excluir recibo:', error);
          feedback.textContent = 'Não foi possível excluir o recibo.';
          feedback.className = 'inline-feedback error';
          deleteButton.disabled = false;
        }
      });

      actionCell.append(editButton, deleteButton);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    }
  }

  function applyFilter() {
    const query = filterInput.value.trim().toLowerCase();
    const filtered = recibos.filter((recibo) =>
      [recibo.nome, recibo.contato, recibo.material, String(recibo.numero)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
    render(filtered);
  }

  filterInput.addEventListener('input', applyFilter);

  try {
    recibos = await window.PMData.listRecibos();
    render(recibos);
  } catch (error) {
    console.error('Erro ao carregar recibos:', error);
    renderEmpty('Não foi possível carregar os recibos.', 'table-empty error-state');
  }
});
