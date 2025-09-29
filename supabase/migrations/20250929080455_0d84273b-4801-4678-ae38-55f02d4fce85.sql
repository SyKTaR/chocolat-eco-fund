-- Création des données de test avec des UUIDs valides générés automatiquement

-- Insérer des données de test dans les régions
INSERT INTO public.regions (name) VALUES 
  ('Île-de-France'),
  ('Provence-Alpes-Côte d''Azur'),
  ('Auvergne-Rhône-Alpes')
ON CONFLICT DO NOTHING;

-- Récupérer les IDs des régions pour les utiliser
DO $$
DECLARE
    region_idf_id uuid;
    region_paca_id uuid;
    region_ara_id uuid;
    store_paris_id uuid;
    store_nice_id uuid;
    store_lyon_id uuid;
    campaign_noel_id uuid;
    campaign_paques_id uuid;
BEGIN
    -- Récupérer les IDs des régions
    SELECT id INTO region_idf_id FROM public.regions WHERE name = 'Île-de-France' LIMIT 1;
    SELECT id INTO region_paca_id FROM public.regions WHERE name = 'Provence-Alpes-Côte d''Azur' LIMIT 1;
    SELECT id INTO region_ara_id FROM public.regions WHERE name = 'Auvergne-Rhône-Alpes' LIMIT 1;

    -- Insérer des magasins de test
    INSERT INTO public.stores (name, address, region_id) VALUES 
      ('Jeff de Bruges Paris Centre', '123 Rue de Rivoli, 75001 Paris', region_idf_id),
      ('Jeff de Bruges Nice', '45 Avenue Jean Médecin, 06000 Nice', region_paca_id),
      ('Jeff de Bruges Lyon', '78 Rue de la République, 69002 Lyon', region_ara_id)
    ON CONFLICT DO NOTHING;

    -- Récupérer les IDs des magasins
    SELECT id INTO store_paris_id FROM public.stores WHERE name = 'Jeff de Bruges Paris Centre' LIMIT 1;
    SELECT id INTO store_nice_id FROM public.stores WHERE name = 'Jeff de Bruges Nice' LIMIT 1;
    SELECT id INTO store_lyon_id FROM public.stores WHERE name = 'Jeff de Bruges Lyon' LIMIT 1;

    -- Insérer des écoles de test
    INSERT INTO public.schools (name, address, store_id, contact_email, custom_message) VALUES 
      ('École Primaire Victor Hugo', '12 Rue Victor Hugo, 75012 Paris', store_paris_id, 'ecole@test.com', 'Soutenez notre projet de classe verte !'),
      ('École Élémentaire Pasteur', '34 Boulevard Pasteur, 06100 Nice', store_nice_id, 'pasteur@test.com', 'Aidez-nous à financer notre bibliothèque')
    ON CONFLICT DO NOTHING;

    -- Insérer des campagnes de test
    INSERT INTO public.campaigns (name, description, start_date, end_date, margin_percentage, is_active) VALUES 
      ('Campagne Noël 2024', 'Collection spéciale de Noël avec chocolats festifs', '2024-11-01'::date, '2024-12-31'::date, 25.00, true),
      ('Campagne Pâques 2025', 'Chocolats de Pâques pour soutenir les projets scolaires', '2025-03-01'::date, '2025-04-15'::date, 20.00, false)
    ON CONFLICT DO NOTHING;

    -- Récupérer les IDs des campagnes
    SELECT id INTO campaign_noel_id FROM public.campaigns WHERE name = 'Campagne Noël 2024' LIMIT 1;
    SELECT id INTO campaign_paques_id FROM public.campaigns WHERE name = 'Campagne Pâques 2025' LIMIT 1;

    -- Insérer des produits de test
    INSERT INTO public.products (name, description, price, campaign_id, is_available) VALUES 
      ('Boîte Assortiment Noël', 'Assortiment de 12 chocolats aux saveurs de Noël', 25.90, campaign_noel_id, true),
      ('Calendrier de l''Avent', 'Calendrier de l''avent avec 24 chocolats', 19.90, campaign_noel_id, true),
      ('Lapin de Pâques', 'Lapin en chocolat au lait 150g', 12.50, campaign_paques_id, true)
    ON CONFLICT DO NOTHING;
END$$;