-- Create profiles table if not exists
create table if not exists public.profiles (
  id uuid references auth.users primary key,
  name text,
  avatar_url text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create products table
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price decimal(10,2) not null,
  category text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text default 'active'
);

-- Create user_investments table
create table if not exists public.user_investments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products not null,
  amount decimal(10,2) not null,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type text not null,
  amount decimal(10,2) not null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for new tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.user_investments enable row level security;
alter table public.transactions enable row level security;

-- Create policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Create policies for products
create policy "Anyone can view active products"
  on public.products for select
  using ( status = 'active' );

create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create policies for user_investments
create policy "Users can view their own investments"
  on public.user_investments for select
  using ( auth.uid() = user_id );

create policy "Users can create investments"
  on public.user_investments for insert
  with check ( auth.uid() = user_id );

-- Create policies for transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using ( auth.uid() = user_id );

-- Create or update the handle_new_user function
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');

  insert into public.user_wallet (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new users if it doesn't exist
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Create indexes
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_user_investments_user_id on public.user_investments(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_type on public.transactions(type);
