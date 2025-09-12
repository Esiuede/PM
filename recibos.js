document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('recibosTable').querySelector('tbody');
    const filtroNomeInput = document.getElementById('filtroNome');
    
    // Substitua pelo URL do seu Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbwTKH8E4uyOd0Kt6OS2xHfFMrtdSDIh8CrxLV8fGhlLxy7TYHvl1Dw1JpsQmNL44JlxIQ/exec';

    let todosRecibos = [];
    
    // Função para verificar se a string é um horário válido (HH:mm ou HH:mm:ss)
    function isHoraValida(hora) {
      if (typeof hora !== 'string' || !hora) {
        return false;
      }
      return /^\d{2}:\d{2}(:\d{2})?$/.test(hora);
    }

    // Função para formatar a data e hora para exibição na tabela
    function formatarDataCompleta(dataString, horaString) {
      if (!dataString) {
        return 'N/A';
      }
      const data = new Date(dataString);
      const dataFormatada = data.toLocaleDateString('pt-BR');
      
      let horaFormatada = '';
      if (isHoraValida(horaString)) {
        // Pega apenas HH:mm, ignorando os segundos
        horaFormatada = horaString.substring(0, 5); 
      }
      return `${dataFormatada} ${horaFormatada}`;
    }

    async function carregarRecibos() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Erro de rede: ${response.status}`);
        }
        todosRecibos = await response.json();
        filtrarRecibos();
      } catch (error) {
        console.error("Falha ao carregar os recibos:", error);
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Não foi possível carregar os dados. Verifique sua conexão com a API.</td></tr>';
      }
    }
    
    function renderTable(recibosParaExibir) {
        tableBody.innerHTML = '';
        
        recibosParaExibir.forEach(recibo => {
            const tipo = (recibo.superior ? 'Superior' : '') + (recibo.inferior ? ' Inferior' : '');
            
            const provaFormatada = formatarDataCompleta(recibo.diaProva, recibo.horaProva);
            const entregaFormatada = formatarDataCompleta(recibo.dataEntrega, recibo.horaEntrega);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${recibo.recibo || 'N/A'}</td>
                <td>${recibo.nome || 'N/A'}</td>
                <td>${recibo.modelo || 'N/A'}</td>
                <td>${recibo.quantidade || 'N/A'}</td>
                <td>${tipo || 'N/A'}</td>
                <td>${provaFormatada}</td>
                <td>${entregaFormatada}</td>
                <td>R$ ${parseFloat(recibo.valor).toFixed(2) || '0.00'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${recibo.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${recibo.id}">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        if (recibosParaExibir.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Nenhum recibo encontrado.</td></tr>';
        }

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                window.location.href = `cadastro.html?id=${id}`;
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Tem certeza que deseja excluir este recibo?')) {
                    const id = e.target.dataset.id;
                    await deleteRecibo(id);
                }
            });
        });
    }
    
    function filtrarRecibos() {
        const textoFiltro = filtroNomeInput.value.toLowerCase();
        const recibosFiltrados = todosRecibos.filter(recibo => {
            return (recibo.nome || '').toLowerCase().includes(textoFiltro);
        });
        renderTable(recibosFiltrados);
    }

    async function deleteRecibo(id) {
        const payload = { action: 'delete', id: parseInt(id) };
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        await carregarRecibos();
    }

    filtroNomeInput.addEventListener('input', filtrarRecibos);

    carregarRecibos();
});