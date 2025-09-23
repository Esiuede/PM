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
    
    const API_URL = 'https://script.google.com/macros/s/AKfycbwMX1U61B2ArlEoQJu4i8SiD14NNdRbi0CSGrj7yPoK6zbC91oU4ZmqGNiv1aCg5YpKww/exec';

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dataReciboInput.value = formattedDate;

    function formatarMoeda(value) {
        let numericValue = value.replace(/\D/g, '');
        if (!numericValue) return '';
        
        let cents = numericValue.slice(-2);
        let reais = numericValue.slice(0, -2);
        
        reais = reais.split('').reverse().join('').match(/.{1,3}/g);
        reais = reais.join('.').split('').reverse().join('');
        
        return `R$ ${reais},${cents}`;
    }

    function calcularValorRestante() {
        const valorTotal = parseFloat(valorTotalInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
        const valorEntrada = parseFloat(valorEntradaInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
        const valorRestante = valorTotal - valorEntrada;
        
        const formattedRestante = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valorRestante);
        
        valorRestanteInput.value = formattedRestante;
    }
    
    valorTotalInput.addEventListener('input', (e) => {
        e.target.value = formatarMoeda(e.target.value);
        calcularValorRestante();
    });

    valorEntradaInput.addEventListener('input', (e) => {
        e.target.value = formatarMoeda(e.target.value);
        calcularValorRestante();
    });

    let recibos = [];
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da API.');
        }
        recibos = await response.json();
    } catch (error) {
        console.error("Falha ao carregar os recibos:", error);
    }

    if (reciboId) {
        const recibo = recibos.find(r => r.id === parseInt(reciboId));
        if (recibo) {
            form.elements['nome'].value = recibo.nome || '';
            form.elements['contato'].value = recibo.contato || '';
            form.elements['cor'].value = recibo.cor || '';
            form.elements['modelo'].value = recibo.modelo || '';
            form.elements['quantidade'].value = recibo.quantidade || '';
            form.elements['material'].value = recibo.material || '';
            
            valorTotalInput.value = formatarMoeda(String(recibo.valorTotal));
            valorEntradaInput.value = formatarMoeda(String(recibo.valorEntrada));
            calcularValorRestante();
            
            tipoPagamentoInput.value = recibo.tipoPagamento || '';
            
            form.elements['diaProva'].value = recibo.diaProva ? recibo.diaProva.substring(0, 10) : '';
            form.elements['horaProva'].value = recibo.horaProva || '';
            form.elements['dataEntrega'].value = recibo.dataEntrega ? recibo.dataEntrega.substring(0, 10) : '';
            form.elements['horaEntrega'].value = recibo.horaEntrega || '';
            
            form.elements['superior'].checked = !!recibo.superior;
            form.elements['inferior'].checked = !!recibo.inferior;
            
            reciboInput.value = recibo.recibo || '';
            
            form.querySelector('button[type="submit"]').textContent = 'Atualizar';
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

        const data = {
            id: reciboId ? parseInt(reciboId) : Date.now(),
            dataRecibo: dataReciboInput.value,
            valorTotal: parseFloat(valorTotalInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0,
            valorEntrada: parseFloat(valorEntradaInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0,
            valorRestante: parseFloat(valorRestanteInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0,
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

        const action = reciboId ? 'edit' : 'add';
        const payload = { action, ...data };

        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain'
            }
        });

        alert('Recibo salvo com sucesso!');
        window.location.href = 'recibos.html';
    });
});