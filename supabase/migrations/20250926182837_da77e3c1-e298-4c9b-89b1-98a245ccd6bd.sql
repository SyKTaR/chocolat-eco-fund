-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('siege', 'magasin', 'ecole', 'parent');

-- Create regions table for stores
CREATE TABLE public.regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stores table
CREATE TABLE public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  region_id UUID REFERENCES public.regions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schools table
CREATE TABLE public.schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  custom_message TEXT,
  margin_explanation TEXT,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  margin_percentage DECIMAL(5,2) DEFAULT 20.00,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign_stores junction table
CREATE TABLE public.campaign_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, store_id)
);

-- Create campaign_schools junction table
CREATE TABLE public.campaign_schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, school_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id),
  school_id UUID REFERENCES public.schools(id),
  parent_id UUID REFERENCES public.profiles(id),
  total_amount DECIMAL(10,2) NOT NULL,
  margin_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for regions (readable by authenticated users)
CREATE POLICY "Regions are viewable by authenticated users" ON public.regions
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for stores
CREATE POLICY "Stores are viewable by authenticated users" ON public.stores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only siege can manage stores" ON public.stores
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );

-- RLS Policies for schools
CREATE POLICY "Schools are viewable by related users" ON public.schools
  FOR SELECT TO authenticated USING (
    -- School users can see their own school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND school_id = schools.id)
    OR
    -- Store users can see schools in their store
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'magasin' AND store_id = schools.store_id)
    OR
    -- Siege can see all schools
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );

-- RLS Policies for campaigns
CREATE POLICY "Campaigns are viewable by authenticated users" ON public.campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only siege can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );

-- RLS Policies for products
CREATE POLICY "Products are viewable by authenticated users" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only siege can manage products" ON public.products
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );

-- RLS Policies for orders
CREATE POLICY "Users can view related orders" ON public.orders
  FOR SELECT TO authenticated USING (
    -- Parents can see their own orders
    parent_id = auth.uid()
    OR
    -- Schools can see orders for their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ecole' AND school_id = orders.school_id)
    OR
    -- Stores can see orders for schools in their store
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.schools s ON s.id = orders.school_id
      WHERE p.id = auth.uid() AND p.role = 'magasin' AND p.store_id = s.store_id
    )
    OR
    -- Siege can see all orders
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siege')
  );

CREATE POLICY "Parents can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (
    parent_id = auth.uid()
  );

-- Insert sample data
INSERT INTO public.regions (name) VALUES 
  ('Île-de-France'),
  ('Provence-Alpes-Côte d''Azur'),
  ('Auvergne-Rhône-Alpes');

INSERT INTO public.stores (name, address, region_id) VALUES 
  ('Jeff de Bruges Paris Centre', '123 Rue de Rivoli, Paris', (SELECT id FROM public.regions WHERE name = 'Île-de-France')),
  ('Jeff de Bruges Marseille', '456 La Canebière, Marseille', (SELECT id FROM public.regions WHERE name = 'Provence-Alpes-Côte d''Azur'));

INSERT INTO public.schools (name, address, store_id, custom_message, margin_explanation) VALUES 
  (
    'École Primaire Saint-Antoine', 
    '789 Avenue des Écoles, Paris',
    (SELECT id FROM public.stores WHERE name = 'Jeff de Bruges Paris Centre'),
    'Vos achats financent notre sortie au musée du Louvre 🎨',
    'Grâce à vos commandes, nous collectons des fonds pour financer les sorties éducatives et le matériel scolaire.'
  );