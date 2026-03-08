
DROP VIEW IF EXISTS public.xp_leaderboard;

CREATE OR REPLACE VIEW public.xp_leaderboard
WITH (security_invoker = true)
AS
SELECT
  sx.user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(sx.xp_earned), 0)::integer AS total_xp
FROM public.student_xp sx
LEFT JOIN public.profiles p ON p.user_id = sx.user_id
GROUP BY sx.user_id, p.name, p.avatar_url
ORDER BY total_xp DESC
LIMIT 50;
