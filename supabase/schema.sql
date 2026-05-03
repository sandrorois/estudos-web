-- Execute no SQL Editor do Supabase
create extension if not exists "uuid-ossp";

create table materias (
  id          bigint primary key generated always as identity,
  user_id     uuid references auth.users(id) on delete cascade not null,
  nome        text not null, tipo text not null default 'base', prioridade text not null default 'media', ordem int not null default 0,
  created_at  timestamptz default now()
);
alter table materias enable row level security;
create policy "own" on materias for all using (auth.uid() = user_id);

create table conteudos (
  id          bigint primary key generated always as identity,
  materia_id  bigint references materias(id) on delete cascade not null,
  nome        text not null, meta_horas numeric(5,1) not null default 0,
  questoes    boolean not null default true, status smallint not null default 0, ordem int not null default 0,
  created_at  timestamptz default now()
);
alter table conteudos enable row level security;
create policy "own" on conteudos for all using (exists(select 1 from materias m where m.id=conteudos.materia_id and m.user_id=auth.uid()));

create table slots_semana (
  id          bigint primary key generated always as identity,
  user_id     uuid references auth.users(id) on delete cascade not null,
  dia text not null, tipo text not null default 'base',
  materia_id  bigint references materias(id) on delete set null,
  conteudo_id bigint references conteudos(id) on delete set null,
  mat_txt     text not null default '', ctt_txt text not null default '',
  horas text not null default '2h30', questoes boolean not null default false,
  status smallint not null default 0, ordem int not null default 0,
  created_at  timestamptz default now()
);
alter table slots_semana enable row level security;
create policy "own" on slots_semana for all using (auth.uid() = user_id);

create table sessoes (
  id           bigint primary key generated always as identity,
  user_id      uuid references auth.users(id) on delete cascade not null,
  data         date not null, tipo text not null default 'base',
  materia_id   bigint references materias(id) on delete set null,
  conteudo_id  bigint references conteudos(id) on delete set null,
  materia_nome text not null default '', conteudo_nome text not null default '',
  questoes     boolean not null default false, questoes_count int not null default 0,
  duracao_min  int not null, hora text not null,
  obs          text, manual boolean default false, early boolean default false,
  created_at   timestamptz default now()
);
alter table sessoes enable row level security;
create policy "own" on sessoes for all using (auth.uid() = user_id);
create index sessoes_user_data on sessoes(user_id, data);

create table planos_dia (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null, nota text not null default '', meta_horas numeric(4,1) not null default 0,
  created_at timestamptz default now(),
  unique (user_id, data)
);
alter table planos_dia enable row level security;
create policy "own" on planos_dia for all using (auth.uid() = user_id);

create table erros (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null, materia_nome text not null default '', conteudo_nome text not null default '',
  questao text not null default '', porque text not null default '', revisado boolean not null default false,
  created_at timestamptz default now()
);
alter table erros enable row level security;
create policy "own" on erros for all using (auth.uid() = user_id);
