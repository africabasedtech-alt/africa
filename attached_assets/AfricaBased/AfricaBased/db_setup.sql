-- USERS TABLE AND POLICIES FOR SUPABASE
-- 1. Create users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  phone text not null unique,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- 3. Allow anyone to check if a user exists (for registration form validation)
create policy if not exists "Allow select for all" on public.users
  for select
  using (true);

-- 4. Allow insert for authenticated users (for profile creation after signup)
create policy if not exists "Allow insert for authenticated" on public.users
  for insert
  with check (auth.uid() is not null);

-- 5. Allow update for the user who owns the row
create policy if not exists "Allow update for owner" on public.users
  for update
  using (auth.uid() = id);

-- 6. (Optional) Sync users table with auth.users on signup (recommended)
-- This trigger will auto-create a row in public.users when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- WITHDRAWALS TABLE AND POLICIES FOR SUPABASE
-- 1. Create withdrawals table
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  amount numeric(18,2) not null check (amount > 0),
  status text not null default 'pending', -- pending, approved, rejected
  requested_at timestamp with time zone default timezone('utc'::text, now()),
  processed_at timestamp with time zone,
  notes text
);

-- 2. Enable Row Level Security (RLS)
alter table public.withdrawals enable row level security;

-- 3. Allow users to select their own withdrawals
create policy if not exists "Allow select own withdrawals" on public.withdrawals
  for select
  using (auth.uid() = user_id);

-- 4. Allow users to insert withdrawals for themselves
create policy if not exists "Allow insert own withdrawals" on public.withdrawals
  for insert
  with check (auth.uid() = user_id);

-- 5. Allow users to update their own withdrawals (optional, e.g. to cancel if pending)
create policy if not exists "Allow update own withdrawals" on public.withdrawals
  for update
  using (auth.uid() = user_id and status = 'pending');