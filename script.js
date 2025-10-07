document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('reciboForm');
    const params = new URLSearchParams(window.location.search);
    const reciboId = params.get('id');
    const reciboInput = document.getElementById('recibo');
    
    const valorTotalInput = document.getElementById('valorTotal');
    const valorEntradaInput = document.getElementById('valorEntrada');
    const valorRestanteInput = document.getElementById('valorRestante');
    const dataReciboInput = document.getElementById('dataRecibo');
    const tipoPagamentoInput = document.getElementById('tipoPagamento');
    
    const API_URL_RECIBOS = 'https://script.google.com/macros/s/AKfycbz7VH4hden3srEFmG95FD_37zGVm-GZYAikS4d4ikR0QxRUp7qDv3z7_giwAAqqtXRiYQ/exec';
    
    // URL da API do Financeiro ATUALIZADA
    const API_URL_FINANCEIRO = 'https://script.google.com/macros/s/AKfycbyvTJfLnL_fHdpWGRAw9JpFSPcNhZvdZ6PKQ9YHuQX7lBoJ_d_q-CuFLZtDdmLKyuipyA/exec';

    // =====================================================================
    // INICIALIZAÇÃO DA MÁSCARA COM IMask.js
    // =====================================================================
    const maskOptions = {
        mask: 'R$ num',
        blocks: {
            num: {
                mask: Number,
                scale: 2,
                radix: ',',
                mapToRadix: ['.'],
                thousandsSeparator: '.',
                padFractionalZeros: true
            }
        }
    };

    const valorTotalMask = IMask(valorTotalInput, maskOptions);
    const valorEntradaMask = IMask(valorEntradaInput, maskOptions);
    // =====================================================================

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dataReciboInput.value = formattedDate;

    function formatarValorParaDisplay(valor) {
        const numericValue = parseFloat(valor);
        if (isNaN(numericValue)) return "R$ 0,00";
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
    }
    
    function calcularValorRestante() {
        const valorTotal = parseFloat(valorTotalMask.unmaskedValue) || 0;
        const valorEntrada = parseFloat(valorEntradaMask.unmaskedValue) || 0;
        const valorRestante = valorTotal - valorEntrada;
        
        valorRestanteInput.value = formatarValorParaDisplay(valorRestante);
    }
    
    valorTotalInput.addEventListener('input', calcularValorRestante);
    valorEntradaInput.addEventListener('input', calcularValorRestante);

    let recibos = [];
    try {
        const response = await fetch(API_URL_RECIBOS);
        if (!response.ok) throw new Error('Erro ao carregar dados da API de recibos.');
        recibos = await response.json();
    } catch (error) {
        console.error("Falha ao carregar os recibos:", error);
    }

    if (reciboId) {
        const recibo = recibos.find(r => r.id === parseInt(reciboId));
        if (recibo) {
            form.querySelector('button[type="submit"]').textContent = 'Atualizar';
            form.elements['nome'].value = recibo.nome || '';
            
            valorTotalMask.value = String(recibo.valorTotal || '').replace('.', ',');
            valorEntradaMask.value = String(recibo.valorEntrada || '').replace('.', ',');
            
            form.elements['contato'].value = recibo.contato || '';
            form.elements['cor'].value = recibo.cor || '';
            form.elements['modelo'].value = recibo.modelo || '';
            form.elements['quantidade'].value = recibo.quantidade || '';
            form.elements['material'].value = recibo.material || '';
            tipoPagamentoInput.value = recibo.tipoPagamento || '';
            form.elements['diaProva'].value = recibo.diaProva ? recibo.diaProva.substring(0, 10) : '';
            form.elements['horaProva'].value = recibo.horaProva || '';
            form.elements['dataEntrega'].value = recibo.dataEntrega ? recibo.dataEntrega.substring(0, 10) : '';
            form.elements['horaEntrega'].value = recibo.horaEntrega || '';
            form.elements['superior'].checked = !!recibo.superior;
            form.elements['inferior'].checked = !!recibo.inferior;
            reciboInput.value = recibo.recibo || '';
            
            calcularValorRestante();
        } else {
            alert("Recibo não encontrado!");
            window.location.href = 'recibos.html';
        }
    } else {
        const ultimoRecibo = recibos.length > 0 ? Math.max(...recibos.map(r => parseInt(r.recibo) || 0)) : 0;
        reciboInput.value = ultimoRecibo + 1;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const valorRestanteCalculado = (parseFloat(valorTotalMask.unmaskedValue) || 0) - (parseFloat(valorEntradaMask.unmaskedValue) || 0);

        const dataRecibo = {
            id: reciboId ? parseInt(reciboId) : Date.now(),
            dataRecibo: dataReciboInput.value,
            valorTotal: parseFloat(valorTotalMask.unmaskedValue) || 0,
            valorEntrada: parseFloat(valorEntradaMask.unmaskedValue) || 0,
            valorRestante: valorRestanteCalculado,
            nome: form.elements['nome'].value,
            contato: form.elements['contato'].value,
            cor: form.elements['cor'].value,
            modelo: form.elements['modelo'].value,
            quantidade: form.elements['quantidade'].value,
            material: form.elements['material'].value,
            tipoPagamento: tipoPagamentoInput.value,
            diaProva: form.elements['diaProva'].value,
            horaProva: form.elements['horaProva'].value,
            dataEntrega: form.elements['dataEntrega'].value,
            horaEntrega: form.elements['horaEntrega'].value,
            superior: form.elements['superior'].checked,
            inferior: form.elements['inferior'].checked,
            recibo: reciboInput.value
        };

        try {
            const action = reciboId ? 'edit' : 'add';
            const payloadRecibo = { action, ...dataRecibo };

            const responseRecibo = await fetch(API_URL_RECIBOS, {
                method: 'POST',
                body: JSON.stringify(payloadRecibo),
                headers: { 'Content-Type': 'text/plain' }
            });
            if (!responseRecibo.ok) throw new Error("Falha ao salvar o recibo.");

            alert('Recibo salvo com sucesso!');

            if (action === 'add') {
                const statusConta = dataRecibo.valorRestante > 0 ? 'A receber' : 'Recebido';
                const dataContaAReceber = {
                    action: 'addContaAReceber',
                    id: Date.now(),
                    vencimento: dataRecibo.dataEntrega || dataRecibo.dataRecibo,
                    cliente: dataRecibo.nome,
                    valor: dataRecibo.valorRestante,
                    descricao: `Referente ao recibo Nº ${dataRecibo.recibo}`,
                    status: statusConta,
                    reciboId: dataRecibo.id
                };

                console.log("Enviando para API Financeiro:", dataContaAReceber);

                try {
                    const responseFinanceiro = await fetch(API_URL_FINANCEIRO, {
                        method: 'POST',
                        body: JSON.stringify(dataContaAReceber),
                        headers: { 'Content-Type': 'text/plain' }
                    });
                    
                    const resultFinanceiro = await responseFinanceiro.json();
                    console.log("Resposta da API Financeiro:", resultFinanceiro);

                    if (!resultFinanceiro.success) {
                        throw new Error(resultFinanceiro.message);
                    }
                    
                } catch (financeiroError) {
                    console.error("Erro ao criar conta a receber:", financeiroError);
                    alert("O recibo foi salvo, mas houve um erro ao criar o título no financeiro: " + financeiroError.message);
                }
            }
            
            window.location.href = 'recibos.html';

        } catch (error) {
            alert(`Erro: ${error.message}`);
            console.error("Erro ao processar formulário:", error);
        }
    });
});