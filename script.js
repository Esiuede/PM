document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('reciboForm');
    const params = new URLSearchParams(window.location.search);
    const reciboId = params.get('id');
    const reciboInput = document.getElementById('recibo');
    const valorInput = document.getElementById('valor');
    
    // Substitua pelo URL do seu Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbwTKH8E4uyOd0Kt6OS2xHfFMrtdSDIh8CrxLV8fGhlLxy7TYHvl1Dw1JpsQmNL44JlxIQ/exec';

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
            form.elements['cor'].value = recibo.cor || '';
            form.elements['modelo'].value = recibo.modelo || '';
            form.elements['quantidade'].value = recibo.quantidade || '';
            form.elements['material'].value = recibo.material || '';
            
            const valor = parseFloat(recibo.valor);
            if (!isNaN(valor)) {
                const valorFormatado = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(valor);
                valorInput.value = valorFormatado;
            } else {
                valorInput.value = '';
            }
            
            // Formata a data e hora para os campos de input
            const diaProva = recibo.diaProva ? recibo.diaProva.substring(0, 10) : '';
            const dataEntrega = recibo.dataEntrega ? recibo.dataEntrega.substring(0, 10) : '';
            const horaProva = recibo.horaProva ? recibo.horaProva.substring(0, 5) : '';
            const horaEntrega = recibo.horaEntrega ? recibo.horaEntrega.substring(0, 5) : '';

            form.elements['diaProva'].value = diaProva;
            form.elements['horaProva'].value = horaProva;
            form.elements['dataEntrega'].value = dataEntrega;
            form.elements['horaEntrega'].value = horaEntrega;
            
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

    valorInput.addEventListener('input', (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.padStart(3, '0');
        }
        
        let cents = value.slice(-2);
        let reais = value.slice(0, -2);
        
        reais = reais.split('').reverse().join('').match(/.{1,3}/g);
        reais = reais.join('.').split('').reverse().join('');
        
        e.target.value = `R$ ${reais},${cents}`;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const valorNumerico = parseFloat(valorInput.value.replace('R$', '').replace(/\./g, '').replace(',', '.'));

        const horaProva = form.elements['horaProva'].value || '';
        const horaEntrega = form.elements['horaEntrega'].value || '';

        const data = {
            id: reciboId ? parseInt(reciboId) : Date.now(),
            nome: form.elements['nome'].value,
            cor: form.elements['cor'].value,
            modelo: form.elements['modelo'].value,
            quantidade: form.elements['quantidade'].value,
            material: form.elements['material'].value,
            valor: valorNumerico,
            diaProva: form.elements['diaProva'].value,
            horaProva: horaProva,
            dataEntrega: form.elements['dataEntrega'].value,
            horaEntrega: horaEntrega,
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