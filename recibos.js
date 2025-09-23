document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('recibosTable').querySelector('tbody');
    const filtroNomeInput = document.getElementById('filtroNome');
    
    // Substitua pelo URL do seu Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbwMX1U61B2ArlEoQJu4i8SiD14NNdRbi0CSGrj7yPoK6zbC91oU4ZmqGNiv1aCg5YpKww/exec';

    let todosRecibos = [];
    
    function formatarValorMonetario(valor) {
        let numericValue = parseFloat(valor);
        if (isNaN(numericValue) || numericValue === 0) {
            return 'R$ 0,00';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numericValue);
    }

    function isHoraValida(hora) {
      if (typeof hora !== 'string' || !hora) {
        return false;
      }
      return /^\d{2}:\d{2}(:\d{2})?$/.test(hora);
    }

    function formatarDataCompleta(dataString, horaString) {
      if (!dataString) {
        return 'N/A';
      }
      const data = new Date(dataString);
      const dataFormatada = data.toLocaleDateString('pt-BR');
      
      let horaFormatada = '';
      if (isHoraValida(horaString)) {
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
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${recibo.recibo || 'N/A'}</td>
                <td>${recibo.dataRecibo ? new Date(recibo.dataRecibo).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td>${recibo.nome || 'N/A'}</td>
                <td>${formatarValorMonetario(recibo.valorTotal)}</td>
                <td>${formatarValorMonetario(recibo.valorEntrada)}</td>
                <td>${formatarValorMonetario(recibo.valorRestante)}</td>
                <td>${recibo.tipoPagamento || 'N/A'}</td>
                <td>${recibo.modelo || 'N/A'}</td>
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
                    const payload = { action: 'delete', id: parseInt(e.target.dataset.id) };
                    await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': 'text/plain'
                        }
                    });
                    await carregarRecibos();
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

    filtroNomeInput.addEventListener('input', filtrarRecibos);

    carregarRecibos();
});