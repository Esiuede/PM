document.addEventListener('DOMContentLoaded', () => {
    // ######################################################################
    // CERTIFIQUE-SE DE QUE A URL DO SEU SCRIPT DO FINANCEIRO ESTÁ AQUI
    const API_URL = 'https://script.google.com/macros/s/AKfycbyvTJfLnL_fHdpWGRAw9JpFSPcNhZvdZ6PKQ9YHuQX7lBoJ_d_q-CuFLZtDdmLKyuipyA/exec';
    // ######################################################################

    // --- Elementos do DOM (Modal de Contas) ---
    const tableBody = document.getElementById('contasReceberTable').querySelector('tbody');
    const modal = document.getElementById('contaModal');
    const addContaBtn = document.getElementById('addContaBtn');
    const closeBtn = modal.querySelector('.close-btn');
    const contaForm = document.getElementById('contaForm');
    const modalTitle = document.getElementById('modalTitle');
    const valorInput = document.getElementById('valor');
    let allContas = [];

    // --- Elementos do DOM (NOVO MODAL PIX) ---
    const pixModal = document.getElementById('pixModal');
    const openPixModalBtn = document.getElementById('openPixModalBtn');
    const closePixBtn = pixModal.querySelector('.close-btn');


    // --- MÁSCARA DE MOEDA (IMask.js) ---
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
    
    // --- FUNÇÕES DE FORMATAÇÃO ---
    function desformatarMoeda(value) {
        if (!value) return 0;
        currencyMask.unmaskedValue = value;
        return parseFloat(currencyMask.unmaskedValue) || 0;
    }
    
    function formatarValorParaDisplay(valor) {
        const numericValue = parseFloat(valor);
        if (isNaN(numericValue)) return "R$ 0,00";
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
    }

    // --- LÓGICA DO MODAL (Adicionar Conta) ---
    const openModal = (conta = null) => {
        contaForm.reset();
        currencyMask.value = '';
        if (conta) {
            modalTitle.textContent = 'Editar Conta a Receber';
            document.getElementById('contaId').value = conta.id;
            document.getElementById('vencimento').value = conta.vencimento ? conta.vencimento.substring(0, 10) : '';
            document.getElementById('cliente').value = conta.cliente;
            currencyMask.value = String(conta.valor || '0').replace('.', ',');
            document.getElementById('descricao').value = conta.descricao;
            document.getElementById('status').value = conta.status;
        } else {
            modalTitle.textContent = 'Adicionar Nova Conta a Receber';
            document.getElementById('contaId').value = '';
        }
        modal.style.display = 'block';
    };
    const closeModal = () => modal.style.display = 'none';

    addContaBtn.addEventListener('click', () => openModal());
    closeBtn.addEventListener('click', closeModal);

    // --- LÓGICA DO MODAL (QRCODE PIX) ---
    openPixModalBtn.addEventListener('click', () => {
        pixModal.style.display = 'block';
    });
    closePixBtn.addEventListener('click', () => {
        pixModal.style.display = 'none';
    });


    // --- Fechar modals ao clicar fora ---
    window.addEventListener('click', (event) => { 
        if (event.target === modal) closeModal(); 
        if (event.target === pixModal) {
            pixModal.style.display = 'none';
        }
    });

    // --- CARREGAR E RENDERIZAR DADOS ---
    async function carregarContas() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">A carregar...</td></tr>`;
            const response = await fetch(`${API_URL}?action=getContasAReceber`);
            if (!response.ok) throw new Error('Falha ao carregar contas a receber.');
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
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma conta a receber encontrada.</td></tr>';
            return;
        }

        contas.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

        contas.forEach(conta => {
            if (!conta.id) return;

            const row = document.createElement('tr');
            const statusClass = (conta.status || '').toLowerCase().replace(/ /g, '-');
            row.className = `status-${statusClass}`;
            
            row.innerHTML = `
                <td>${conta.vencimento ? new Date(conta.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</td>
                <td>${conta.cliente || ''}</td>
                <td>${conta.descricao || ''}</td>
                <td>${formatarValorParaDisplay(conta.valor)}</td>
                <td><span class="status-tag">${conta.status || 'N/A'}</span></td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${conta.id}">Editar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- AÇÕES CRUD ---
    contaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('contaId').value;
        
        // CORREÇÃO: Define a ação correta se estiver a editar ou a adicionar
        const action = id ? 'editContaAReceber' : 'addContaAReceber';

        let reciboIdOriginal = 'Manual';
        if (id) {
            const contaOriginal = allContas.find(c => c.id === parseInt(id));
            if (contaOriginal) {
                reciboIdOriginal = contaOriginal.reciboId;
            }
        }

        const data = {
            action: action,
            id: id ? parseInt(id) : Date.now(),
            vencimento: document.getElementById('vencimento').value,
            cliente: document.getElementById('cliente').value,
            valor: desformatarMoeda(valorInput.value),
            descricao: document.getElementById('descricao').value,
            status: document.getElementById('status').value,
            reciboId: reciboIdOriginal
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'text-plain' }
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

    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('edit-btn')) {
            const id = parseInt(target.dataset.id);
            const conta = allContas.find(c => c.id === id);
            if (conta) openModal(conta);
        }
    });
    
    // --- ESTILOS ADICIONAIS ---
    const style = document.createElement('style');
    style.innerHTML = `
        .status-a-receber .status-tag { background-color: #f4a261; } /* Laranja */
        .status-recebido .status-tag { background-color: #28a745; } /* Verde */
        .status-em-atraso .status-tag { background-color: #e63946; } /* Vermelho */
        .actions-cell { text-align: center; }
    `;
    document.head.appendChild(style);

    carregarContas();
});