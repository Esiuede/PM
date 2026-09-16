document.addEventListener('DOMContentLoaded', async () => {
  const auth = await window.pmAuthReady;
  if (!auth.authenticated) return;

  const form = document.getElementById('reciboForm');
  const params = new URLSearchParams(window.location.search);
  const reciboId = params.get('id');

  const valorTotalInput = document.getElementById('valorTotal');
  const valorEntradaInput = document.getElementById('valorEntrada');
  const valorRestanteInput = document.getElementById('valorRestante');
  const dataReciboInput = document.getElementById('dataRecibo');
  const reciboInput = document.getElementById('recibo');
  const submitButton = form.querySelector('button[type="submit"]');
  const formMessage = document.getElementById('formMessage');

  const maskOptions = {
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
  };

  const valorTotalMask = IMask(valorTotalInput, maskOptions);
  const valorEntradaMask = IMask(valorEntradaInput, maskOptions);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);

  function calculateRemaining() {
    const total = Number(valorTotalMask.unmaskedValue) || 0;
    const entry = Number(valorEntradaMask.unmaskedValue) || 0;
    valorRestanteInput.value = formatCurrency(Math.max(total - entry, 0));
  }

  valorTotalInput.addEventListener('input', calculateRemaining);
  valorEntradaInput.addEventListener('input', calculateRemaining);

  if (!reciboId) {
    dataReciboInput.value = new Date().toISOString().slice(0, 10);
    reciboInput.value = 'Automático';
  }

  try {
    if (reciboId) {
      const recibo = await window.PMData.getRecibo(reciboId);

      form.dataset.mode = 'edit';
      document.getElementById('pageTitle').textContent = `Editar Recibo Nº ${recibo.numero}`;
      submitButton.textContent = 'Atualizar recibo';

      dataReciboInput.value = recibo.data_recibo || '';
      form.elements.nome.value = recibo.nome || '';
      form.elements.contato.value = recibo.contato || '';
      form.elements.cor.value = recibo.cor || '';
      form.elements.modelo.value = recibo.modelo || '';
      form.elements.quantidade.value = recibo.quantidade || 1;
      form.elements.material.value = recibo.material || '';
      form.elements.tipoPagamento.value = recibo.tipo_pagamento || '';
      form.elements.diaProva.value = recibo.dia_prova || '';
      form.elements.horaProva.value = recibo.hora_prova || '';
      form.elements.dataEntrega.value = recibo.data_entrega || '';
      form.elements.horaEntrega.value = recibo.hora_entrega || '';
      form.elements.superior.checked = Boolean(recibo.superior);
      form.elements.inferior.checked = Boolean(recibo.inferior);
      reciboInput.value = recibo.numero;

      valorTotalMask.value = String(recibo.valor_total ?? 0).replace('.', ',');
      valorEntradaMask.value = String(recibo.valor_entrada ?? 0).replace('.', ',');
      calculateRemaining();
    }
  } catch (error) {
    console.error('Erro ao carregar recibo:', error);
    formMessage.textContent = 'Não foi possível carregar este recibo.';
    formMessage.className = 'form-message error';
    submitButton.disabled = true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formMessage.textContent = '';

    const valorTotal = Number(valorTotalMask.unmaskedValue) || 0;
    const valorEntrada = Number(valorEntradaMask.unmaskedValue) || 0;

    if (valorEntrada > valorTotal) {
      formMessage.textContent = 'O valor de entrada não pode ser maior que o valor total.';
      formMessage.className = 'form-message error';
      valorEntradaInput.focus();
      return;
    }

    const payload = {
      data_recibo: dataReciboInput.value,
      nome: form.elements.nome.value.trim(),
      contato: form.elements.contato.value.trim() || null,
      cor: form.elements.cor.value.trim() || null,
      modelo: form.elements.modelo.value.trim() || null,
      quantidade: Number(form.elements.quantidade.value) || 1,
      material: form.elements.material.value.trim() || null,
      valor_total: valorTotal,
      valor_entrada: valorEntrada,
      tipo_pagamento: form.elements.tipoPagamento.value || null,
      dia_prova: form.elements.diaProva.value || null,
      hora_prova: form.elements.horaProva.value || null,
      data_entrega: form.elements.dataEntrega.value || null,
      hora_entrega: form.elements.horaEntrega.value || null,
      superior: form.elements.superior.checked,
      inferior: form.elements.inferior.checked
    };

    submitButton.disabled = true;
    submitButton.textContent = reciboId ? 'Atualizando...' : 'Salvando...';

    try {
      const saved = reciboId
        ? await window.PMData.updateRecibo(reciboId, payload)
        : await window.PMData.createRecibo(payload);

      formMessage.textContent = `Recibo Nº ${saved.numero} salvo com sucesso.`;
      formMessage.className = 'form-message success';

      window.setTimeout(() => {
        window.location.href = 'recibos.html';
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar recibo:', error);
      formMessage.textContent =
        error.message || 'Não foi possível salvar o recibo.';
      formMessage.className = 'form-message error';
      submitButton.disabled = false;
      submitButton.textContent = reciboId ? 'Atualizar recibo' : 'Salvar recibo';
    }
  });
});
