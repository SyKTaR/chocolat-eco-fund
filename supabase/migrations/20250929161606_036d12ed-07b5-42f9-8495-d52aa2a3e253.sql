-- Add foreign key constraint from cart_items to products
ALTER TABLE public.cart_items 
ADD CONSTRAINT cart_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;