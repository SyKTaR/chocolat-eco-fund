import { useState, useEffect } from "react";
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

interface CartItem extends Product {
  quantity: number;
}

export default function Shop() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  const fetchProducts = async () => {
    // For now, we'll fetch all available products
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les produits"
      });
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

  useEffect(() => {
    Promise.all([fetchProducts(), fetchSchoolInfo()]).then(() => {
      setLoading(false);
    });
  }, [profile]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    toast({
      title: "Produit ajouté",
      description: `${product.name} ajouté au panier`
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
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
          {cart.length > 0 && (
            <div className="bg-background rounded-lg p-4 shadow-sm border">
              <div className="text-center">
                <div className="font-semibold">{getCartItemsCount()} articles</div>
                <div className="text-lg font-bold text-primary">
                  {getTotalPrice().toFixed(2)} €
                </div>
                <Button size="sm" className="mt-2 w-full">
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
          const cartItem = cart.find(item => item.id === product.id);
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
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="mx-3 font-medium">{cartItem.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
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
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-50">
          <Button size="lg" className="rounded-full shadow-lg">
            <ShoppingBag className="h-5 w-5 mr-2" />
            {getCartItemsCount()} • {getTotalPrice().toFixed(2)} €
          </Button>
        </div>
      )}
    </div>
  );
}