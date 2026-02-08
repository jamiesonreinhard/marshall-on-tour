-- Add needs_review flag for content quality gates (video, Marshall mention, AFF)
alter table public.posts
  add column if not exists needs_review boolean default false not null,
  add column if not exists content_quality_notes text;

comment on column public.posts.needs_review is 'Set when content quality checks fail (missing video, Marshall mention, or AFF for gear/travel)';
comment on column public.posts.content_quality_notes is 'Reasons for needs_review (e.g. missing Marshall mention, missing AFF in first 400 words)';
