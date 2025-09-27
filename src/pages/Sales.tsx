import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, Euro, Users, Target, Calendar, BarChart3 } from "lucide-react";

interface SalesData {
  totalRevenue: number;
  marginCollected: number;
  orderCount: number;
  averageOrder: number;
  recentOrders: any[];
}

export default function Sales() {
  const { profile } = useAuth();
  const [salesData, setSalesData] = useState<SalesData>({
    totalRevenue: 0,
    marginCollected: 0,
    orderCount: 0,
    averageOrder: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');

  const fetchSalesData = async () => {
    if (!profile?.school_id) return;

    // Calculate date filter
    let dateFilter = '';
    if (timeframe !== 'all') {
      const days = timeframe === '7d' ? 7 : 30;
      const date = new Date();
      date.setDate(date.getDate() - days);
      dateFilter = date.toISOString();
    }

    // Build query
    let query = supabase
      .from('orders')
      .select('*')
      .eq('school_id', profile.school_id);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données de vente"
      });
    } else if (orders) {
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const marginCollected = orders.reduce((sum, order) => sum + order.margin_amount, 0);
      const orderCount = orders.length;
      const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

      setSalesData({
        totalRevenue,
        marginCollected,
        orderCount,
        averageOrder,
        recentOrders: orders.slice(0, 5)
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSalesData();
  }, [profile, timeframe]);

  if (!profile) {
    return <div>Chargement...</div>;
  }

  if (profile.role !== 'ecole') {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
        <p className="text-muted-foreground">Cette page est réservée aux écoles.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement des données de vente...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes ventes</h1>
          <p className="text-muted-foreground">
            Suivez les revenus collectés pour vos projets scolaires
          </p>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex bg-muted rounded-lg p-1">
          {[
            { key: '7d', label: '7 jours' },
            { key: '30d', label: '30 jours' },
            { key: 'all', label: 'Tout' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setTimeframe(period.key as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === period.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus collectés</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {salesData.marginCollected.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">
              Pour vos projets scolaires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData.totalRevenue.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">
              Total des ventes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre de commandes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.orderCount}</div>
            <p className="text-xs text-muted-foreground">
              Familles participantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData.averageOrder.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">
              Par commande
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objectif de collecte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectif de collecte
            </CardTitle>
            <CardDescription>
              Suivez l'avancement de votre campagne
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{salesData.marginCollected.toFixed(2)} € / 1000 €</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((salesData.marginCollected / 1000) * 100, 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {((salesData.marginCollected / 1000) * 100).toFixed(1)}% de l'objectif atteint
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">💰 Utilisation prévue</h4>
              <p className="text-sm text-muted-foreground">
                Les fonds collectés financeront la sortie scolaire de fin d'année au Château de Versailles.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Commandes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Commandes récentes
            </CardTitle>
            <CardDescription>
              Dernières ventes de votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesData.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {salesData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{order.parent_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.total_amount.toFixed(2)} €</p>
                      <p className="text-xs text-primary">
                        +{order.margin_amount.toFixed(2)} € collectés
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune commande récente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Gérez votre boutique et vos ventes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border rounded-lg text-left hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Modifier l'objectif</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Ajustez votre objectif de collecte
              </p>
            </button>
            
            <button className="p-4 border rounded-lg text-left hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Inviter des parents</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Partagez votre boutique
              </p>
            </button>
            
            <button className="p-4 border rounded-lg text-left hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Rapport détaillé</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Téléchargez le rapport complet
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}