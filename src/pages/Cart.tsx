import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Plus, Minus, Trash2, Package, CreditCard, ArrowLeft } from "lucide-react";

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
    campaign_id: string;
  };
}

interface School {
  id: string;
  name: string;
  custom_message: string;
  margin_explanation: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<School | null>(null);

  const fetchCart = async () => {
    if (!profile?.id) return;

    // Get cart items first
    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity')
      .eq('user_id', profile.id);

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le panier"
      });
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
      .select('id, name, description, price, image_url, campaign_id')
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
          image_url: '',
          campaign_id: ''
        }
      };
    });

    setCartItems(formattedCartItems);
  };

  const fetchSchoolInfo = async () => {
    if (profile?.school_id) {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, custom_message, margin_explanation')
        .eq('id', profile.school_id)
        .single();

      if (!error && data) {
        setSchoolInfo(data);
      }
    }
  };

  useEffect(() => {
    Promise.all([fetchCart(), fetchSchoolInfo()]).then(() => {
      setLoading(false);
    });
  }, [profile]);

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
      } else {
        fetchCart();
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
      } else {
        fetchCart();
      }
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getMarginAmount = () => {
    // Assuming 20% margin for schools
    return getTotalPrice() * 0.20;
  };

  const handleCheckout = async () => {
    if (!profile || cartItems.length === 0) return;

    setSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          school_id: profile.school_id,
          parent_id: profile.id,
          parent_name: profile.name,
          parent_email: profile.email,
          total_amount: getTotalPrice(),
          margin_amount: getMarginAmount(),
          status: 'pending',
          campaign_id: cartItems[0]?.product.campaign_id // For simplicity, using first item's campaign
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', profile.id);

      if (clearError) throw clearError;

      toast({
        title: "Commande confirmée !",
        description: "Votre commande a été enregistrée. Vous serez notifié quand elle sera prête pour récupération."
      });

      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de finaliser la commande"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return <div className="flex items-center justify-center min-h-[400px]">Chargement...</div>;
  }

  if (profile.role !== 'parent') {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
        <p className="text-muted-foreground">Cette page est réservée aux parents.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement du panier...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/shop')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 md:h-8 w-8" />
          Mon panier
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Panier vide</h3>
            <p className="text-muted-foreground mb-4">
              Découvrez nos délicieux chocolats pour soutenir l'école !
            </p>
            <Button onClick={() => navigate('/shop')}>
              Continuer les achats
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium">{item.product.name}</h3>
                      {item.product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.product.description}
                        </p>
                      )}
                      <div className="text-lg font-semibold">
                        {item.product.price.toFixed(2)} €
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, 0)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {(item.product.price * item.quantity).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{getTotalPrice().toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Contribution école</span>
                    <span>+{getMarginAmount().toFixed(2)} €</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{getTotalPrice().toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {schoolInfo?.margin_explanation && (
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                    💡 {schoolInfo.margin_explanation}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium">Livraison</div>
                  <Badge variant="outline" className="w-full justify-center py-2">
                    Click & Collect - {schoolInfo?.name || "École"}
                  </Badge>
                  <p className="text-xs text-muted-foreground text-center">
                    Récupération gratuite à l'école. Vous serez notifié quand votre commande sera prête.
                  </p>
                </div>

                <Button 
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {submitting ? "Traitement..." : "Finaliser la commande"}
                </Button>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              onClick={() => navigate('/shop')}
              className="w-full"
            >
              Continuer les achats
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}