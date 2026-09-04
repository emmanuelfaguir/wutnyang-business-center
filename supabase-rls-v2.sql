-- WUTNYANG BUSINESS CENTER: role permissions (Version 2.1)
-- Run this in Supabase SQL Editor. It deliberately does NOT remove any
-- existing anonymous/public transaction policy; remove that only after final testing.

create or replace function public.wbc_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

grant execute on function public.wbc_current_role() to authenticated;

alter table public.transactions enable row level security;

drop policy if exists "wbc v2 read transactions by role" on public.transactions;
create policy "wbc v2 read transactions by role"
on public.transactions
for select
to authenticated
using (
  public.wbc_current_role() in ('admin', 'manager')
  or (
    public.wbc_current_role() = 'staff'
    and date = current_date
  )
);

drop policy if exists "wbc v2 add own transactions" on public.transactions;
create policy "wbc v2 add own transactions"
on public.transactions
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and public.wbc_current_role() in ('admin', 'manager', 'staff')
);

drop policy if exists "wbc v2 admin updates transactions" on public.transactions;
create policy "wbc v2 admin updates transactions"
on public.transactions
for update
to authenticated
using (public.wbc_current_role() = 'admin')
with check (public.wbc_current_role() = 'admin');

drop policy if exists "wbc v2 admin deletes transactions" on public.transactions;
create policy "wbc v2 admin deletes transactions"
on public.transactions
for delete
to authenticated
using (public.wbc_current_role() = 'admin');

-- Final hardening (run only after Admin, Manager, and Staff tests are complete):
-- Find the existing anonymous/public transactions policy in Authentication /
-- Database / Policies, then remove only that old policy.
