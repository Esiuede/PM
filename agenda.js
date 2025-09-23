document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanban-board');
    const weekDatesDiv = document.getElementById('weekDates');
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const openModalBtn = document.getElementById('openModalBtn');
    const modal = document.getElementById('addCardModal');
    const closeBtn = document.querySelector('.close-btn');
    const agendamentoForm = document.getElementById('agendamentoForm');

    // Substitua pelo URL da sua API de Recibos
    const API_URL = 'https://script.google.com/macros/s/AKfycbwMX1U61B2ArlEoQJu4i8SiD14NNdRbi0CSGrj7yPoK6zbC91oU4ZmqGNiv1aCg5YpKww/exec';

    let currentWeekStart = getStartOfWeek(new Date());

    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    function formatDate(date) {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    function renderWeek() {
        kanbanBoard.innerHTML = '';
        const week = [];
        const start = new Date(currentWeekStart);

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            week.push(day);
        }

        const weekString = `${formatDate(week[0])} - ${formatDate(week[6])}`;
        weekDatesDiv.textContent = weekString;

        week.forEach(day => {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            const dayName = day.toLocaleDateString('pt-BR', { weekday: 'long' });
            const dayDate = day.getDate();
            dayColumn.innerHTML = `<div class="day-header">${dayName.charAt(0).toUpperCase() + dayName.slice(1)} - ${dayDate}</div>`;
            dayColumn.id = `day-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            kanbanBoard.appendChild(dayColumn);
        });
    }

    async function loadAppointments() {
        renderWeek();
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar os dados.');
            const records = await response.json();

            records.forEach(record => {
                const appointmentTypes = [];
                const materialLowerCase = record.material ? record.material.toLowerCase() : '';

                if (materialLowerCase.includes('moldagem')) {
                    if (record.diaProva) appointmentTypes.push({ type: 'Moldagem', date: new Date(record.diaProva), time: record.horaProva });
                } else if (materialLowerCase.includes('conserto')) {
                    if (record.diaProva) appointmentTypes.push({ type: 'Conserto', date: new Date(record.diaProva), time: record.horaProva });
                }
                if (record.diaProva && !materialLowerCase.includes('moldagem') && !materialLowerCase.includes('conserto')) {
                     appointmentTypes.push({ type: 'Prova', date: new Date(record.diaProva), time: record.horaProva });
                }
                if (record.dataEntrega) {
                    appointmentTypes.push({ type: 'Entrega', date: new Date(record.dataEntrega), time: record.horaEntrega });
                }

                appointmentTypes.forEach(appointment => {
                    const appointmentDay = new Date(appointment.date);
                    const dayColumn = document.getElementById(`day-${appointmentDay.getFullYear()}-${appointmentDay.getMonth()}-${appointmentDay.getDate()}`);
                    
                    if (dayColumn) {
                        const card = document.createElement('div');
                        card.className = `card card-${appointment.type.toLowerCase()}`;
                        card.innerHTML = `
                            <div class="card-title">${appointment.type} - ${record.nome}</div>
                            <div class="card-body">
                                Horário: ${appointment.time || 'N/A'}<br>
                                Recibo: ${record.recibo || 'N/A'}
                            </div>
                        `;
                        dayColumn.appendChild(card);
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar a agenda:', error);
            kanbanBoard.innerHTML = '<p style="text-align:center; color:red;">Não foi possível carregar a agenda. Verifique a API.</p>';
        }
    }

    // Lógica para abrir/fechar o modal
    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    agendamentoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nomeCliente = document.getElementById('nomeCliente').value;
        const tipoAtendimento = document.getElementById('tipoAtendimento').value;
        const dataAtendimento = document.getElementById('dataAtendimento').value;
        const horaAtendimento = document.getElementById('horaAtendimento').value;

        let dataToSave = {
            id: Date.now(),
            action: 'add',
            nome: nomeCliente,
            recibo: 'N/A',
        };

        if (tipoAtendimento === 'Prova') {
            dataToSave.diaProva = dataAtendimento;
            dataToSave.horaProva = horaAtendimento;
        } else if (tipoAtendimento === 'Entrega') {
            dataToSave.dataEntrega = dataAtendimento;
            dataToSave.horaEntrega = horaAtendimento;
        } else {
            dataToSave.diaProva = dataAtendimento;
            dataToSave.horaProva = horaAtendimento;
            dataToSave.material = tipoAtendimento; // Agora salvamos o tipo diretamente no campo material
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(dataToSave),
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            if (!response.ok) throw new Error('Falha ao salvar agendamento.');

            alert('Agendamento salvo com sucesso!');
            modal.style.display = 'none';
            agendamentoForm.reset();
            loadAppointments(); // Recarrega a agenda
        } catch (error) {
            alert('Erro ao salvar agendamento.');
            console.error('Erro ao salvar:', error);
        }
    });

    prevWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        loadAppointments();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        loadAppointments();
    });

    loadAppointments();
});