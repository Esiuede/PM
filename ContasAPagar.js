document.addEventListener('DOMContentLoaded', () => {
    // ######################################################################
    // Verifique se a URL da sua API do Financeiro está correta
    const API_URL = 'https://script.google.com/macros/s/AKfycbyXECxtIv-2x0fOGobshZ-fti1gFYttTmDraezqqhk2ergT7pUgm-gKm9aqVt4eJMdDiw/exec';
    // ######################################################################

    // Elementos do DOM
    const tableBody = document.getElementById('contasPagarTable').querySelector('tbody');
    const modal = document.getElementById('contaModal');
    const addContaBtn = document.getElementById('addContaBtn');
    const closeBtn = modal.querySelector('.close-btn');
    const contaForm = document.getElementById('contaForm');
    const modalTitle = document.getElementById('modalTitle');
    const valorInput = document.getElementById('valor');
    let allContas = [];

    // =====================================================================
    // SOLUÇÃO DEFINITIVA COM BIBLIOTECA IMask.js
    // =====================================================================
    const currencyMask = IMask(valorInput, {
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
    });
    // =====================================================================
    
    // Função para remover a formatação e obter o número puro para salvar
    function desformatarMoeda(value) {
        if (!value) return 0;
        // A própria máscara já nos ajuda a obter o valor não formatado
        currencyMask.unmaskedValue = value;
        return parseFloat(currencyMask.unmaskedValue) || 0;
    }
    
    // Função para formatar o valor na tabela
    function formatarValorParaDisplay(valor) {
        const numericValue = parseFloat(valor);
        if (isNaN(numericValue)) {
            return "R$ 0,00";
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numericValue);
    }

    // --- LÓGICA DO MODAL ---
    const openModal = (conta = null) => {
        contaForm.reset();
        currencyMask.value = ''; // Limpa o campo de valor ao abrir
        if (conta) {
            modalTitle.textContent = 'Editar Conta a Pagar';
            document.getElementById('contaId').value = conta.id;
            document.getElementById('vencimento').value = conta.vencimento.substring(0, 10);
            document.getElementById('fornecedor').value = conta.fornecedor;
            currencyMask.value = String(conta.valor).replace('.', ','); // Define o valor na máscara
            document.getElementById('descricao').value = conta.descricao;
            document.getElementById('categoria').value = conta.categoria;
            document.getElementById('formaPagamento').value = conta.formaPagamento;
            document.getElementById('status').value = conta.status;
        } else {
            modalTitle.textContent = 'Adicionar Nova Conta a Pagar';
            document.getElementById('contaId').value = '';
        }
        modal.style.display = 'block';
    };
    const closeModal = () => modal.style.display = 'none';

    addContaBtn.addEventListener('click', () => openModal());
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

    // --- CARREGAR E RENDERIZAR DADOS ---
    async function carregarContas() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Carregando...</td></tr>`;
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar contas. Verifique a URL da API.');
            allContas = await response.json();
            renderTable(allContas);
        } catch (error) {
            console.error('Erro:', error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${error.message}</td></tr>`;
        }
    }

    function renderTable(contas) {
        tableBody.innerHTML = '';
        if (contas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma conta a pagar encontrada.</td></tr>';
            return;
        }

        contas.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

        contas.forEach(conta => {
             if (!conta.id) return;

            const row = document.createElement('tr');
            const statusClass = (conta.status || '').toLowerCase().replace(' ', '-');
            row.className = `status-${statusClass}`;
            
            row.innerHTML = `
                <td>${new Date(conta.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td>${conta.fornecedor || ''}</td>
                <td>${formatarValorParaDisplay(conta.valor)}</td>
                <td>${conta.categoria || ''}</td>
                <td><span class="status-tag">${conta.status || 'N/A'}</span></td>
                <td>
                    <button class="action-btn edit-btn" data-id="${conta.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${conta.id}">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // --- AÇÕES CRUD (SALVAR, EDITAR, EXCLUIR) ---
    contaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('contaId').value;
        const action = id ? 'edit' : 'add';

        const data = {
            action: action,
            id: id ? parseInt(id) : Date.now(),
            vencimento: document.getElementById('vencimento').value,
            fornecedor: document.getElementById('fornecedor').value,
            valor: desformatarMoeda(valorInput.value),
            descricao: document.getElementById('descricao').value,
            categoria: document.getElementById('categoria').value,
            formaPagamento: document.getElementById('formaPagamento').value,
            status: document.getElementById('status').value,
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'text/plain' }
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            alert('Conta salva com sucesso!');
            closeModal();
            carregarContas();
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    });

    tableBody.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target.dataset.id) return;
        const id = parseInt(target.dataset.id);

        if (target.classList.contains('edit-btn')) {
            const conta = allContas.find(c => c.id === id);
            if (conta) openModal(conta);
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm('Tem certeza que deseja excluir esta conta?')) {
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: 'delete', id: id }),
                        headers: { 'Content-Type': 'text/plain' }
                    });
                    const result = await response.json();
                    if (!result.success) throw new Error(result.message);

                    alert('Conta excluída com sucesso!');
                    carregarContas();
                } catch (error) {
                    alert(`Erro ao excluir: ${error.message}`);
                }
            }
        }
    });

    carregarContas();
});