-- Add RLS policies for existing kv_store table
CREATE POLICY "KV store is accessible by authenticated users" ON public.kv_store_acd3eb81
  FOR ALL TO authenticated USING (true);