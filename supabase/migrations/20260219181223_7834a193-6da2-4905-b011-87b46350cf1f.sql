
-- Tighten the update policy: only allow updating status to 'completed'
DROP POLICY "Anyone can update by token" ON public.schedule_resubmission_requests;
CREATE POLICY "Anyone can update status to completed"
ON public.schedule_resubmission_requests FOR UPDATE
USING (status = 'pending' AND expires_at > now());
