-- Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Profiles table to track activity
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  last_active_at timestamp with time zone default now(),
  last_action_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Goals table
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  is_completed boolean default false,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Milestones table
create table if not exists milestones (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references goals(id) on delete cascade not null,
  title text not null,
  date date,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Check items table
create table if not exists check_items (
  id uuid primary key default uuid_generate_v4(),
  milestone_id uuid references milestones(id) on delete cascade not null,
  text text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists goals_user_id_idx on goals(user_id);
create index if not exists milestones_goal_id_idx on milestones(goal_id);
create index if not exists check_items_milestone_id_idx on check_items(milestone_id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table goals enable row level security;
alter table milestones enable row level security;
alter table check_items enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for goals
create policy "Users can view own goals" on goals
  for select using (auth.uid() = user_id);

create policy "Users can insert own goals" on goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update own goals" on goals
  for update using (auth.uid() = user_id);

create policy "Users can delete own goals" on goals
  for delete using (auth.uid() = user_id);

-- RLS Policies for milestones (via goal ownership)
create policy "Users can view own milestones" on milestones
  for select using (
    exists (
      select 1 from goals
      where goals.id = milestones.goal_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can insert own milestones" on milestones
  for insert with check (
    exists (
      select 1 from goals
      where goals.id = milestones.goal_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can update own milestones" on milestones
  for update using (
    exists (
      select 1 from goals
      where goals.id = milestones.goal_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can delete own milestones" on milestones
  for delete using (
    exists (
      select 1 from goals
      where goals.id = milestones.goal_id
      and goals.user_id = auth.uid()
    )
  );

-- RLS Policies for check_items (via milestone -> goal ownership)
create policy "Users can view own check items" on check_items
  for select using (
    exists (
      select 1 from milestones
      join goals on goals.id = milestones.goal_id
      where milestones.id = check_items.milestone_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can insert own check items" on check_items
  for insert with check (
    exists (
      select 1 from milestones
      join goals on goals.id = milestones.goal_id
      where milestones.id = check_items.milestone_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can update own check items" on check_items
  for update using (
    exists (
      select 1 from milestones
      join goals on goals.id = milestones.goal_id
      where milestones.id = check_items.milestone_id
      and goals.user_id = auth.uid()
    )
  );

create policy "Users can delete own check items" on check_items
  for delete using (
    exists (
      select 1 from milestones
      join goals on goals.id = milestones.goal_id
      where milestones.id = check_items.milestone_id
      and goals.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_goals_updated_at
  before update on goals
  for each row
  execute function update_updated_at_column();

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
