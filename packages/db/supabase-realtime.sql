-- Apply this in the Supabase project that backs AmbiOS Realtime.
-- The API issues five-minute JWTs with canvas_id/canvas_read/canvas_write claims.
alter table realtime.messages enable row level security;

create policy "ambios canvas read"
on realtime.messages for select
to authenticated
using (
  realtime.topic() = 'canvas:' || (select auth.jwt() ->> 'canvas_id')
  and coalesce(((select auth.jwt() ->> 'canvas_read')::boolean), false)
);

create policy "ambios canvas write"
on realtime.messages for insert
to authenticated
with check (
  realtime.topic() = 'canvas:' || (select auth.jwt() ->> 'canvas_id')
  and coalesce(((select auth.jwt() ->> 'canvas_write')::boolean), false)
);
