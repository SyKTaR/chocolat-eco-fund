import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Package, Plus, Minus, Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  campaign_id: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
  };
}

export default function Shop() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  const fetchProducts = async () => {
    if (!profile?.school_id) {
      setProducts([]);
      return;
    }

    // Get products from active campaigns for this school
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        campaigns!inner(
          id,
          name,
          is_active,
          campaign_schools!inner(
            school_id,
            is_active
          )
        )
      `)
      .eq('is_available', true)
      .eq('campaigns.is_active', true)
      .eq('campaigns.campaign_schools.school_id', profile.school_id)
      .eq('campaigns.campaign_schools.is_active', true);

    if (error) {
      console.error('Error fetching products:', error);
      // Fallback: get all available products
      const { data: fallbackData } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);
      setProducts(fallbackData || []);
    } else {
      setProducts(data || []);
    }
  };

  const fetchSchoolInfo = async () => {
    if (profile?.school_id) {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();

      if (error) {
        console.error('Error fetching school info:', error);
      } else {
        setSchoolInfo(data);
      }
    }
  };

  const fetchCartItems = async () => {
    if (!profile?.id) return;

    // Get cart items first
    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity')
      .eq('user_id', profile.id);

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return;
    }

    if (!cartData || cartData.length === 0) {
      setCartItems([]);
      return;
    }

    // Get products for cart items
    const productIds = cartData.map(item => item.product_id);
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    // Combine cart items with product data
    const formattedCartItems = cartData.map(cartItem => {
      const product = productsData?.find(p => p.id === cartItem.product_id);
      return {
        ...cartItem,
        product: product || {
          id: '',
          name: 'Produit non trouvé',
          description: '',
          price: 0,
          image_url: ''
        }
      };
    });

    setCartItems(formattedCartItems);
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchSchoolInfo(), fetchCartItems()]).then(() => {
      setLoading(false);
    });
  }, [profile]);

  const addToCart = async (product: Product) => {
    if (!profile?.id) return;

    // Check if item already exists in cart
    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'ajouter le produit"
        });
        return;
      }
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart_items')
        .insert([{
          user_id: profile.id,
          product_id: product.id,
          quantity: 1
        }]);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'ajouter le produit"
        });
        return;
      }
    }

    toast({
      title: "Produit ajouté",
      description: `${product.name} ajouté au panier`
    });
    
    fetchCartItems();
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de supprimer l'article"
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from('cart_items')  
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour la quantité"
        });
        return;
      }
    }
    
    fetchCartItems();
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (!profile) {
    return <div>Chargement...</div>;
  }

  if (profile.role !== 'parent' && profile.role !== 'ecole') {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
        <p className="text-muted-foreground">Cette page est réservée aux parents et aux écoles.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement de la boutique...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with school info */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 md:h-8 w-8" />
              {schoolInfo ? `Boutique ${schoolInfo.name}` : "Boutique Jeff de Bruges"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {schoolInfo?.custom_message || "Découvrez nos délicieux chocolats et soutenez les projets de l'école !"}
            </p>
            {schoolInfo?.margin_explanation && (
              <p className="text-sm text-primary mt-2 font-medium">
                💡 {schoolInfo.margin_explanation}
              </p>
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="bg-background rounded-lg p-4 shadow-sm border">
              <div className="text-center">
                <div className="font-semibold">{getCartItemsCount()} articles</div>
                <div className="text-lg font-bold text-primary">
                  {getTotalPrice().toFixed(2)} €
                </div>
                <Button size="sm" className="mt-2 w-full" onClick={() => navigate('/cart')}>
                  Voir le panier
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const cartItem = cartItems.find(item => item.product_id === product.id);
          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">{product.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {product.price.toFixed(2)} €
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {product.description && (
                  <CardDescription className="text-sm mb-3 line-clamp-2">
                    {product.description}
                  </CardDescription>
                )}
                
                {cartItem ? (
                  <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="mx-3 font-medium">{cartItem.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full"
                    size="sm"
                  >
                    Ajouter au panier
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Boutique en préparation</h3>
            <p className="text-muted-foreground">
              Les produits seront bientôt disponibles. Revenez plus tard !
            </p>
          </CardContent>
        </Card>
      )}

      {/* Floating cart button on mobile */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-50">
          <Button size="lg" className="rounded-full shadow-lg" onClick={() => navigate('/cart')}>
            <ShoppingBag className="h-5 w-5 mr-2" />
            {getCartItemsCount()} • {getTotalPrice().toFixed(2)} €
          </Button>
        </div>
      )}
    </div>
  );
}