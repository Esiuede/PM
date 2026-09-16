# Migração do ProtheSys para Supabase

Esta branch (`modernizacao-supabase`) troca o Google Sheets/Apps Script por Supabase sem alterar o `main` atual.

## Arquitetura nova

- Supabase Auth para login e sessão.
- `recibos`, `agendamentos`, `contas_pagar` e `contas_receber` no PostgreSQL.
- Conta a receber vinculada ao recibo criada/sincronizada por trigger no banco.
- UUID como identificador técnico e número do recibo sequencial no banco.
- RLS habilitado: as tabelas são acessíveis somente por usuários autenticados.
- Dados retornados do banco são renderizados com `textContent` nas listagens, evitando injeção de HTML com dados cadastrados.
- `prothesys.css` complementa o CSS legado, preservando a identidade visual atual e corrigindo o layout das telas modernizadas.

## Preparação

1. Crie um projeto Supabase para o ProtheSys.
2. Execute `supabase-schema.sql` no SQL Editor.
3. Em Authentication > Users, crie o usuário que utilizará o sistema.
4. Copie Project URL e anon/publishable key para `supabase-config.js`.

A anon/publishable key pode ficar no frontend com RLS habilitado. Nunca coloque `service_role` no site.

## Migração dos dados antigos

Antes de desligar os Apps Scripts, exporte as planilhas para CSV/JSON e mantenha backup.

- Recibos reais -> `recibos`, preservando o número antigo em `numero`.
- Linhas usadas apenas como agendamento (`recibo = N/A`) -> `agendamentos`.
- Contas a pagar -> `contas_pagar`.
- Contas a receber manuais -> `contas_receber`.
- Contas a receber ligadas a recibos não precisam ser duplicadas: o trigger as cria ao inserir os recibos.

Depois da importação, execute o `setval(...)` indicado no fim do schema para continuar a numeração correta.

## Checklist de homologação

- Login/logout e bloqueio das páginas sem sessão.
- Criar, editar, listar, filtrar e excluir recibos.
- Número do recibo automático.
- Conta a receber criada/sincronizada com o recibo.
- Agenda semanal com provas, entregas e agendamentos avulsos.
- CRUD de contas a pagar.
- Edição e inclusão manual de contas a receber.
- QR Code Pix.
- Testes em desktop e celular.
- Conferência dos totais após a importação dos dados.

## Observações encontradas no legado

A versão antiga usa três endpoints de Apps Script (login, recibos e financeiro), IDs com `Date.now()` e páginas internas sem verificação de sessão após o redirecionamento. Também havia renderização de dados do cadastro via `innerHTML` e um `Content-Type: text-plain` incorreto em Contas a Receber. A nova arquitetura elimina esses pontos.

A chave Pix permanece visível na interface como no sistema atual. Como o repositório é público, avalie se esse dado deve continuar versionado publicamente.
