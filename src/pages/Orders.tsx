import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Calendar, User, Euro, Package } from "lucide-react";

interface Order {
  id: string;
  parent_name: string;
  parent_email: string;
  total_amount: number;
  margin_amount: number;
  status: string;
  created_at: string;
  campaign_id: string;
  school_id: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const fetchOrders = async () => {
    let query = supabase.from('orders').select('*');

    // Filter orders based on user role
    if (profile?.role === 'parent') {
      query = query.eq('parent_id', profile.id);
    } else if (profile?.role === 'ecole' && profile.school_id) {
      query = query.eq('school_id', profile.school_id);
    } else if (profile?.role === 'magasin' && profile.store_id) {
      // Get orders for schools managed by this store
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .eq('store_id', profile.store_id);
      
      if (schools && schools.length > 0) {
        const schoolIds = schools.map(s => s.id);
        query = query.in('school_id', schoolIds);
      }
    }
    // For 'siege' role, no filter is applied (see all orders)

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les commandes"
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les détails de la commande"
      });
    } else {
      setOrderItems(data || []);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [profile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getPageTitle = () => {
    switch (profile?.role) {
      case 'parent':
        return 'Mes commandes';
      case 'ecole':
        return 'Commandes reçues';
      case 'magasin':
        return 'Commandes de mes écoles';
      case 'siege':
        return 'Toutes les commandes';
      default:
        return 'Commandes';
    }
  };

  const getPageDescription = () => {
    switch (profile?.role) {
      case 'parent':
        return 'Historique de vos achats pour soutenir les projets scolaires';
      case 'ecole':
        return 'Suivi des commandes de votre boutique scolaire';
      case 'magasin':
        return 'Commandes passées dans vos écoles partenaires';
      case 'siege':
        return 'Vue d\'ensemble de toutes les commandes du réseau';
      default:
        return '';
    }
  };

  if (!profile) {
    return <div>Chargement...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement des commandes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">{getPageTitle()}</h1>
        <p className="text-muted-foreground">{getPageDescription()}</p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'pending').length} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">
              Total des ventes
            </p>
          </CardContent>
        </Card>

        {(profile.role === 'ecole' || profile.role === 'siege') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus collectés</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.reduce((sum, order) => sum + order.margin_amount, 0).toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground">
                Pour les projets scolaires
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.length > 0 
                ? (orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length).toFixed(2)
                : '0.00'} €
            </div>
            <p className="text-xs text-muted-foreground">
              Par commande
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">
                      Commande #{order.id.substring(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {profile.role !== 'parent' && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.parent_name} - {order.parent_email}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Badge variant={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">{order.total_amount.toFixed(2)} €</div>
                    {(profile.role === 'ecole' || profile.role === 'siege') && (
                      <div className="text-sm text-muted-foreground">
                        Revenus: {order.margin_amount.toFixed(2)} €
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedOrder === order.id) {
                      setSelectedOrder(null);
                    } else {
                      setSelectedOrder(order.id);
                      fetchOrderItems(order.id);
                    }
                  }}
                >
                  {selectedOrder === order.id ? 'Masquer détails' : 'Voir détails'}
                </Button>
              </div>
              
              {selectedOrder === order.id && orderItems.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3">Articles commandés</h4>
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>Article (ID: {item.product_id.substring(0, 8)})</span>
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.unit_price.toFixed(2)}€ = {item.total_price.toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground">
              {profile.role === 'parent' 
                ? "Vous n'avez pas encore passé de commande" 
                : "Aucune commande n'a été passée pour le moment"}
            </p>
            {profile.role === 'parent' && (
              <Button className="mt-4">
                Découvrir les boutiques
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}