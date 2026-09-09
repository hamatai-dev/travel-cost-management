-- 既にPhase 0〜6のschema.sqlを実行済みの環境向けの差分マイグレーション。
-- Supabase の SQL Editor でこのファイルの内容だけを実行すればよい
-- (schema.sql全体には既にこの内容が統合済みなので、新規セットアップ時は
-- schema.sql を実行するだけでこのファイルを別途実行する必要はない)。

alter table public.transactions
  add column import_batch_id uuid references public.import_batches(id) on delete cascade;

create index transactions_import_batch_idx on public.transactions (import_batch_id);
