
ALTER TABLE public.textbook_lessons ADD COLUMN scene_image_url text DEFAULT '';

INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-scenes', 'lesson-scenes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view lesson scenes" ON storage.objects FOR SELECT USING (bucket_id = 'lesson-scenes');
CREATE POLICY "Service role can manage lesson scenes" ON storage.objects FOR ALL USING (bucket_id = 'lesson-scenes' AND auth.role() = 'service_role');
