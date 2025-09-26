-- Add missing RLS policies for campaign_stores
CREATE POLICY "Campaign stores are viewable by authenticated users" ON public.campaign_stores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only siege and stores can manage campaign_stores" ON public.campaign_stores
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'magasin' AND store_id = campaign_stores.store_id)
  );

-- Add missing RLS policies for campaign_schools  
CREATE POLICY "Campaign schools are viewable by related users" ON public.campaign_schools
  FOR SELECT TO authenticated USING (
    -- Schools can see their own campaigns
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ecole' AND school_id = campaign_schools.school_id)
    OR
    -- Stores can see campaigns for their schools
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'magasin' AND store_id = campaign_schools.store_id)
    OR
    -- Siege can see all
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );

CREATE POLICY "Only authorized users can manage campaign_schools" ON public.campaign_schools
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'magasin' AND store_id = campaign_schools.store_id)
  );

-- Add missing RLS policies for order_items
CREATE POLICY "Order items are viewable by related users" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id 
      AND (
        -- Parents can see their own order items
        o.parent_id = auth.uid()
        OR
        -- Schools can see order items for their orders
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ecole' AND school_id = o.school_id)
        OR
        -- Stores can see order items for schools in their store
        EXISTS (
          SELECT 1 FROM public.profiles p 
          JOIN public.schools s ON s.id = o.school_id
          WHERE p.id = auth.uid() AND p.role = 'magasin' AND p.store_id = s.store_id
        )
        OR
        -- Siege can see all order items
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
      )
    )
  );

CREATE POLICY "Order items can be inserted with orders" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id 
      AND o.parent_id = auth.uid()
    )
  );

-- Update schools table to add missing policies for INSERT/UPDATE
CREATE POLICY "Schools can be created by authorized users" ON public.schools
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'magasin' AND store_id = schools.store_id)
  );

CREATE POLICY "Schools can be updated by authorized users" ON public.schools
  FOR UPDATE TO authenticated USING (
    -- Schools can update their own info
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ecole' AND school_id = schools.id)
    OR
    -- Stores can update schools in their store
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'magasin' AND store_id = schools.store_id)
    OR
    -- Siege can update all schools
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );