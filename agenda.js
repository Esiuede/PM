document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanban-board');
    const weekDatesDiv = document.getElementById('weekDates');
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const openModalBtn = document.getElementById('openModalBtn');
    const modal = document.getElementById('addCardModal');
    const closeBtn = document.querySelector('.close-btn');
    const agendamentoForm = document.getElementById('agendamentoForm');

    const API_URL = 'https://script.google.com/macros/s/AKfycbz7VH4hden3srEFmG95FD_37zGVm-GZYAikS4d4ikR0QxRUp7qDv3z7_giwAAqqtXRiYQ/exec';

    let currentWeekStart = getStartOfWeek(new Date());

    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    function formatDate(date) {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    function formatTime(timeString) {
        if (!timeString || typeof timeString !== 'string') {
            return 'N/A';
        }
        const timeMatch = timeString.match(/(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[0] : 'N/A';
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
        return week;
    }

    async function loadAppointments() {
        const week = renderWeek();
        const appointmentsByDay = {}; 
        
        week.forEach(day => {
            const dayId = `day-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            appointmentsByDay[dayId] = [];
        });

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar os dados.');
            const records = await response.json();

            records.forEach(record => {
                const materialType = record.material || '';
                const materialLowerCase = materialType.toLowerCase();

                // Lógica para identificar e agrupar todos os agendamentos
                const checkAndAddAppointment = (type, dateField, timeField) => {
                    if (record[dateField]) {
                        const date = new Date(record[dateField]);
                        const time = record[timeField];
                        const dayId = `day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                        
                        if (appointmentsByDay[dayId]) {
                            let appointmentType = type;
                            if (type === 'Prova' && (materialLowerCase.includes('moldagem') || materialLowerCase.includes('conserto') || materialLowerCase.includes('domicilio'))) {
                                appointmentType = record.material; // Usa o valor do campo material
                            }
                            
                            appointmentsByDay[dayId].push({ 
                                type: appointmentType, 
                                date: date, 
                                time: time, 
                                recibo: record.recibo, 
                                nome: record.nome 
                            });
                        }
                    }
                };

                // Verifica Prova/Moldagem/Conserto/Domicilio (usa diaProva)
                checkAndAddAppointment('Prova', 'diaProva', 'horaProva');
                
                // Verifica Entrega (usa dataEntrega) - não deve ser duplicado com Prova
                checkAndAddAppointment('Entrega', 'dataEntrega', 'horaEntrega');
            });

            // Ordena e Renderiza
            Object.keys(appointmentsByDay).forEach(dayId => {
                const appointments = appointmentsByDay[dayId];
                
                // ORDENAÇÃO POR HORÁRIO
                appointments.sort((a, b) => {
                    const timeA = formatTime(a.time);
                    const timeB = formatTime(b.time);
                    return timeA.localeCompare(timeB);
                });

                const dayColumn = document.getElementById(dayId);
                if (dayColumn) {
                    appointments.forEach(appointment => {
                        const card = document.createElement('div');
                        
                        // Garante que o nome da classe seja válido (ex: card-domicilio)
                        const cardClassName = `card card-${appointment.type.toLowerCase().replace(/ /g, '-')}`; 
                        
                        let displayTime = formatTime(appointment.time);

                        card.className = cardClassName;
                        card.innerHTML = `
                            <div class="card-title">${appointment.type} - ${appointment.nome}</div>
                            <div class="card-body">
                                Horário: ${displayTime}<br>
                                Recibo: ${appointment.recibo || 'N/A'}
                            </div>
                        `;
                        dayColumn.appendChild(card);
                    });
                }
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
            dataToSave.material = tipoAtendimento;
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
            loadAppointments();
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