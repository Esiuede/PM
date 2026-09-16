(function createDataService() {
  function client() {
    if (!window.pmSupabase) {
      throw new Error(
        'Supabase não configurado. Preencha supabase-config.js antes de continuar.'
      );
    }
    return window.pmSupabase;
  }

  function throwIfError(error) {
    if (error) throw error;
  }

  async function listRecibos() {
    const { data, error } = await client()
      .from('recibos')
      .select('*')
      .order('numero', { ascending: false });
    throwIfError(error);
    return data ?? [];
  }

  async function listRecentRecibos(limit = 5) {
    const { data, error } = await client()
      .from('recibos')
      .select('id, numero, nome, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    throwIfError(error);
    return data ?? [];
  }

  async function getRecibo(id) {
    const { data, error } = await client()
      .from('recibos')
      .select('*')
      .eq('id', id)
      .single();
    throwIfError(error);
    return data;
  }

  async function createRecibo(payload) {
    const { data, error } = await client()
      .from('recibos')
      .insert(payload)
      .select()
      .single();
    throwIfError(error);
    return data;
  }

  async function updateRecibo(id, payload) {
    const { data, error } = await client()
      .from('recibos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    throwIfError(error);
    return data;
  }

  async function deleteRecibo(id) {
    const { error } = await client().from('recibos').delete().eq('id', id);
    throwIfError(error);
  }

  async function listAgendaForDate(date) {
    const [provas, entregas, avulsos] = await Promise.all([
      client()
        .from('recibos')
        .select('id, numero, nome, material, dia_prova, hora_prova')
        .eq('dia_prova', date),
      client()
        .from('recibos')
        .select('id, numero, nome, data_entrega, hora_entrega')
        .eq('data_entrega', date),
      client()
        .from('agendamentos')
        .select('*')
        .eq('data', date)
    ]);

    throwIfError(provas.error);
    throwIfError(entregas.error);
    throwIfError(avulsos.error);

    const items = [];

    for (const row of provas.data ?? []) {
      const material = (row.material || '').trim();
      const materialLower = material.toLowerCase();
      const tipo =
        ['moldagem', 'conserto', 'domicílio', 'domicilio'].some((term) =>
          materialLower.includes(term)
        )
          ? material
          : 'Prova';

      items.push({
        origem: 'recibo',
        reciboId: row.id,
        reciboNumero: row.numero,
        tipo,
        nome: row.nome,
        data: row.dia_prova,
        hora: row.hora_prova
      });
    }

    for (const row of entregas.data ?? []) {
      items.push({
        origem: 'recibo',
        reciboId: row.id,
        reciboNumero: row.numero,
        tipo: 'Entrega',
        nome: row.nome,
        data: row.data_entrega,
        hora: row.hora_entrega
      });
    }

    for (const row of avulsos.data ?? []) {
      items.push({
        origem: 'avulso',
        agendamentoId: row.id,
        reciboNumero: null,
        tipo: row.tipo,
        nome: row.nome_cliente,
        data: row.data,
        hora: row.hora
      });
    }

    return items.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  }

  async function listAgendaBetween(startDate, endDate) {
    const [provas, entregas, avulsos] = await Promise.all([
      client()
        .from('recibos')
        .select('id, numero, nome, material, dia_prova, hora_prova')
        .gte('dia_prova', startDate)
        .lte('dia_prova', endDate),
      client()
        .from('recibos')
        .select('id, numero, nome, data_entrega, hora_entrega')
        .gte('data_entrega', startDate)
        .lte('data_entrega', endDate),
      client()
        .from('agendamentos')
        .select('*')
        .gte('data', startDate)
        .lte('data', endDate)
    ]);

    throwIfError(provas.error);
    throwIfError(entregas.error);
    throwIfError(avulsos.error);

    const items = [];

    for (const row of provas.data ?? []) {
      const material = (row.material || '').trim();
      const materialLower = material.toLowerCase();
      const tipo =
        ['moldagem', 'conserto', 'domicílio', 'domicilio'].some((term) =>
          materialLower.includes(term)
        )
          ? material
          : 'Prova';

      items.push({
        origem: 'recibo',
        reciboId: row.id,
        reciboNumero: row.numero,
        tipo,
        nome: row.nome,
        data: row.dia_prova,
        hora: row.hora_prova
      });
    }

    for (const row of entregas.data ?? []) {
      items.push({
        origem: 'recibo',
        reciboId: row.id,
        reciboNumero: row.numero,
        tipo: 'Entrega',
        nome: row.nome,
        data: row.data_entrega,
        hora: row.hora_entrega
      });
    }

    for (const row of avulsos.data ?? []) {
      items.push({
        origem: 'avulso',
        agendamentoId: row.id,
        reciboNumero: null,
        tipo: row.tipo,
        nome: row.nome_cliente,
        data: row.data,
        hora: row.hora
      });
    }

    return items.sort((a, b) => {
      const dateCompare = (a.data || '').localeCompare(b.data || '');
      return dateCompare || (a.hora || '').localeCompare(b.hora || '');
    });
  }

  async function createAgendamento(payload) {
    const { data, error } = await client()
      .from('agendamentos')
      .insert(payload)
      .select()
      .single();
    throwIfError(error);
    return data;
  }

  async function listContasPagar() {
    const { data, error } = await client()
      .from('contas_pagar')
      .select('*')
      .order('vencimento', { ascending: true });
    throwIfError(error);
    return data ?? [];
  }

  async function saveContaPagar(id, payload) {
    const query = id
      ? client().from('contas_pagar').update(payload).eq('id', id)
      : client().from('contas_pagar').insert(payload);

    const { data, error } = await query.select().single();
    throwIfError(error);
    return data;
  }

  async function deleteContaPagar(id) {
    const { error } = await client().from('contas_pagar').delete().eq('id', id);
    throwIfError(error);
  }

  async function listContasReceber() {
    const { data, error } = await client()
      .from('contas_receber')
      .select('*')
      .order('vencimento', { ascending: true });
    throwIfError(error);
    return data ?? [];
  }

  async function saveContaReceber(id, payload) {
    const query = id
      ? client().from('contas_receber').update(payload).eq('id', id)
      : client().from('contas_receber').insert(payload);

    const { data, error } = await query.select().single();
    throwIfError(error);
    return data;
  }

  window.PMData = {
    listRecibos,
    listRecentRecibos,
    getRecibo,
    createRecibo,
    updateRecibo,
    deleteRecibo,
    listAgendaForDate,
    listAgendaBetween,
    createAgendamento,
    listContasPagar,
    saveContaPagar,
    deleteContaPagar,
    listContasReceber,
    saveContaReceber
  };
})();
