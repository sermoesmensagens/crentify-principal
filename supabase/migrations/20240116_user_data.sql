-- Create a generic table to store user data (key-value store)
create table if not exists user_data (
  user_id uuid references auth.users not null,
  key text not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, key)
);

-- Enable Row Level Security (RLS)
alter table user_data enable row level security;

-- Create policies to ensure users can only access their own data
create policy "Users can view their own data"
  on user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on user_data for update
  using (auth.uid() = user_id);

create policy "Users can delete their own data"
  on user_data for delete
  using (auth.uid() = user_id);
