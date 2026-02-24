INSERT INTO public.app_settings (key, value)
VALUES ('private_time_options', '["10:00","18:00"]')
ON CONFLICT (key) DO NOTHING;