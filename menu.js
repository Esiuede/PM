document.addEventListener('DOMContentLoaded', () => {
    const agendaContainer = document.getElementById('agendaDoDia');
    const recibosContainer = document.getElementById('ultimosRecibos');

    // URL da sua API do Google Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbz7VH4hden3srEFmG95FD_37zGVm-GZYAikS4d4ikR0QxRUp7qDv3z7_giwAAqqtXRiYQ/exec';

    // Função para formatar a data no formato YYYY-MM-DD para comparação
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Função para buscar e exibir os agendamentos do dia
    const carregarAgendaDoDia = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar dados da agenda.');
            
            const records = await response.json();
            const todayStr = getTodayString();
            const agendamentosDoDia = [];

            records.forEach(rec => {
                // Verifica se a data da prova é hoje
                if (rec.diaProva && rec.diaProva.startsWith(todayStr)) {
                    agendamentosDoDia.push({
                        tipo: rec.material && (rec.material.toLowerCase().includes('moldagem') || rec.material.toLowerCase().includes('conserto') || rec.material.toLowerCase().includes('domicilio')) ? rec.material : 'Prova',
                        nome: rec.nome,
                        hora: rec.horaProva || 'N/A'
                    });
                }
                // Verifica se a data da entrega é hoje
                if (rec.dataEntrega && rec.dataEntrega.startsWith(todayStr)) {
                    agendamentosDoDia.push({
                        tipo: 'Entrega',
                        nome: rec.nome,
                        hora: rec.horaEntrega || 'N/A'
                    });
                }
            });

            // Ordena os agendamentos por hora
            agendamentosDoDia.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

            agendaContainer.innerHTML = ''; // Limpa a mensagem de "carregando"

            if (agendamentosDoDia.length === 0) {
                agendaContainer.innerHTML = '<p>Nenhum agendamento para hoje.</p>';
                return;
            }

            agendamentosDoDia.forEach(agendamento => {
                const horaFormatada = typeof agendamento.hora === 'string' ? agendamento.hora.substring(0, 5) : 'N/A';
                const card = document.createElement('div');
                card.className = `appointment-card card-${agendamento.tipo.toLowerCase().replace(/ /g, '-')}`;
                card.innerHTML = `
                    <div class="appointment-time">${horaFormatada}</div>
                    <div class="appointment-details">
                        <div class="appointment-title">${agendamento.tipo}</div>
                        <div class="appointment-patient">${agendamento.nome}</div>
                    </div>
                `;
                agendaContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Erro ao carregar agenda:", error);
            agendaContainer.innerHTML = '<p style="color:red;">Erro ao carregar agenda.</p>';
        }
    };

    // Função para buscar e exibir os últimos recibos
    const carregarUltimosRecibos = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar recibos.');

            const recibos = await response.json();
            
            // Ordena por número de recibo (do maior para o menor) e pega os 5 últimos
            const ultimosRecibos = recibos
                .sort((a, b) => parseInt(b.recibo || 0) - parseInt(a.recibo || 0))
                .slice(0, 5);
            
            recibosContainer.innerHTML = ''; // Limpa a mensagem de "carregando"

            if (ultimosRecibos.length === 0) {
                recibosContainer.innerHTML = '<p>Nenhum recibo cadastrado.</p>';
                return;
            }

            ultimosRecibos.forEach(recibo => {
                const item = document.createElement('div');
                item.className = 'receipt-item';
                item.innerHTML = `
                    <div class="receipt-info">
                        <span class="receipt-number">Recibo - ${String(recibo.recibo || 'N/A').padStart(2, '0')}</span>
                        <span class="receipt-patient">${recibo.nome}</span>
                    </div>
                    <div class="receipt-actions">
                        <button class="icon-btn">👁️‍🗨️</button> </div>
                `;
                // Adiciona um evento de clique para redirecionar para a página de edição
                item.addEventListener('click', () => {
                    window.location.href = `cadastro.html?id=${recibo.id}`;
                });
                recibosContainer.appendChild(item);
            });

        } catch (error) {
            console.error("Erro ao carregar recibos:", error);
            recibosContainer.innerHTML = '<p style="color:red;">Erro ao carregar recibos.</p>';
        }
    };

    // Carrega as duas seções
    carregarAgendaDoDia();
    carregarUltimosRecibos();
});