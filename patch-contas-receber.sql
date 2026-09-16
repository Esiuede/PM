-- ProtheSys - correção da sincronização de Contas a Receber
-- Rode este arquivo UMA VEZ no SQL Editor do projeto Supabase já existente.
-- Ele atualiza a função/trigger e corrige títulos vinculados que já foram criados.

create or replace function public.sync_conta_receber_from_recibo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.contas_receber (vencimento, cliente, valor, descricao, status, recibo_id)
  values (
    coalesce(new.data_entrega, new.data_recibo),
    new.nome,
    case
      when new.valor_restante = 0 then new.valor_total
      else new.valor_restante
    end,
    'Referente ao recibo Nº ' || new.numero,
    case
      when new.valor_restante = 0 then 'Recebido'
      else 'A receber'
    end,
    new.id
  )
  on conflict (recibo_id) do update set
    vencimento = excluded.vencimento,
    cliente = excluded.cliente,
    valor = excluded.valor,
    descricao = excluded.descricao,
    status = case
      when excluded.status = 'Recebido' then 'Recebido'
      when public.contas_receber.status = 'Em atraso' then 'Em atraso'
      else 'A receber'
    end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists sync_conta_receber_after_recibo on public.recibos;
create trigger sync_conta_receber_after_recibo
after insert or update of nome, valor_total, valor_entrada, data_entrega, data_recibo
on public.recibos
for each row execute function public.sync_conta_receber_from_recibo();

-- Corrige títulos vinculados já existentes.
update public.contas_receber as cr
set
  vencimento = coalesce(r.data_entrega, r.data_recibo),
  cliente = r.nome,
  valor = case
    when r.valor_restante = 0 then r.valor_total
    else r.valor_restante
  end,
  descricao = 'Referente ao recibo Nº ' || r.numero,
  status = case
    when r.valor_restante = 0 then 'Recebido'
    when cr.status = 'Em atraso' then 'Em atraso'
    else 'A receber'
  end,
  updated_at = now()
from public.recibos as r
where cr.recibo_id = r.id;
