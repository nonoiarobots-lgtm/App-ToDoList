-- Row Level Security sur toutes les tables
alter table preferences enable row level security;
alter table projets enable row level security;
alter table taches enable row level security;
alter table recurrences enable row level security;
alter table jobs_notifications enable row level security;

create policy "preferences_user" on preferences for all using (auth.uid() = user_id);
create policy "projets_user" on projets for all using (auth.uid() = user_id);
create policy "taches_user" on taches for all using (auth.uid() = user_id);
create policy "recurrences_user" on recurrences for all using (auth.uid() = user_id);
create policy "jobs_user" on jobs_notifications for all using (auth.uid() = user_id);
