-- Créer les profils de test pour les comptes existants
-- D'abord, supprimer les profils existants s'ils existent
DELETE FROM public.profiles WHERE email IN ('admin@test.com', 'magasin@test.com', 'ecole@test.com', 'parent@test.com');

-- Insérer les profils de test avec les bons rôles
-- Note: Les IDs doivent correspondre aux comptes auth créés manuellement
INSERT INTO public.profiles (id, email, name, role, store_id, school_id) VALUES 
  -- Profile Admin (siege)
  ((SELECT id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1), 'admin@test.com', 'Test Admin', 'siege', NULL, NULL),
  
  -- Profile Magasin 
  ((SELECT id FROM auth.users WHERE email = 'magasin@test.com' LIMIT 1), 'magasin@test.com', 'Test Magasin', 'magasin', 
   (SELECT id FROM public.stores WHERE name = 'Jeff de Bruges Paris Centre' LIMIT 1), NULL),
  
  -- Profile École
  ((SELECT id FROM auth.users WHERE email = 'ecole@test.com' LIMIT 1), 'ecole@test.com', 'Test École', 'ecole', NULL,
   (SELECT id FROM public.schools WHERE name = 'École Primaire Victor Hugo' LIMIT 1)),
  
  -- Profile Parent
  ((SELECT id FROM auth.users WHERE email = 'parent@test.com' LIMIT 1), 'parent@test.com', 'Test Parent', 'parent', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id,
  school_id = EXCLUDED.school_id;