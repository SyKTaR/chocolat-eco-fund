import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Package, School, ShoppingBag, Store, Users } from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return <div>Chargement...</div>;
  }

  const getDashboardContent = () => {
    switch (profile.role) {
      case 'siege':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Tableau de bord - Siège</h1>
              <p className="text-muted-foreground">Vue d'ensemble des campagnes et performances</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campagnes actives</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">+1 depuis le mois dernier</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Magasins partenaires</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Répartis en 3 régions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Écoles participantes</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">+8 nouvelles ce mois</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€24,567</div>
                  <p className="text-xs text-muted-foreground">+12% vs mois précédent</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
        
      case 'magasin':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Tableau de bord - Magasin</h1>
              <p className="text-muted-foreground">Gestion de vos écoles partenaires</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Écoles actives</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">Dans votre secteur</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commandes ce mois</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-xs text-muted-foreground">+15% vs mois dernier</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus générés</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€3,456</div>
                  <p className="text-xs text-muted-foreground">Pour les écoles</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
        
      case 'ecole':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Tableau de bord - École</h1>
              <p className="text-muted-foreground">Suivi de vos ventes et revenus collectés</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commandes reçues</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">Ce mois-ci</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus collectés</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€687</div>
                  <p className="text-xs text-muted-foreground">Pour la sortie scolaire</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Parents participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">Familles impliquées</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
        
      case 'parent':
        return (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Bienvenue !</h1>
              <p className="text-muted-foreground">Découvrez les boutiques des écoles de vos enfants</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Vos dernières commandes</CardTitle>
                <CardDescription>
                  Historique de vos achats pour soutenir les projets scolaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Aucune commande pour le moment.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visitez les boutiques des écoles pour découvrir les produits Jeff de Bruges 
                  et soutenir les projets éducatifs !
                </p>
              </CardContent>
            </Card>
          </>
        );
        
      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  return (
    <div className="space-y-6">
      {getDashboardContent()}
    </div>
  );
}