-- Fix test parent data: Associate with a school and create campaign relationship
UPDATE profiles 
SET school_id = 'bbb4dc1f-53ea-4d7a-adc5-5508eb202c74' 
WHERE id = 'b0c7e837-f5f7-4b52-835e-aaea9b25b8db';

-- Create campaign relationship for the test school
INSERT INTO campaign_schools (campaign_id, school_id, store_id, is_active)
VALUES (
  'd8a1a8ef-0e3d-46b4-9bec-3ab0aedb2e91', -- Campagne Noël 2024
  'bbb4dc1f-53ea-4d7a-adc5-5508eb202c74', -- École Primaire Saint-Antoine  
  '105b4bf9-0c24-48b5-aeb0-7305a716e2c7', -- Jeff de Bruges Paris Centre
  true
)
ON CONFLICT (campaign_id, school_id) DO UPDATE SET is_active = true;