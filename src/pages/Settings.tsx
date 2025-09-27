import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Plus, Users, Building2, Package, Shield } from "lucide-react";

interface Region {
  id: string;
  name: string;
  created_at: string;
}

export default function Settings() {
  const { profile } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  const [systemSettings, setSystemSettings] = useState({
    default_margin: 20,
    max_campaign_duration: 90,
    email_notifications: true,
    auto_approve_schools: false
  });

  const fetchRegions = async () => {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('name');

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les régions"
      });
    } else {
      setRegions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleCreateRegion = async () => {
    if (!newRegionName.trim()) return;

    const { error } = await supabase
      .from('regions')
      .insert([{ name: newRegionName.trim() }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la région"
      });
    } else {
      toast({
        title: "Succès",
        description: "Région créée avec succès"
      });
      setNewRegionName("");
      setRegionDialogOpen(false);
      fetchRegions();
    }
  };

  if (!profile) {
    return <div>Chargement...</div>;
  }

  if (profile.role !== 'siege') {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
        <p className="text-muted-foreground">Cette page est réservée au siège.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement des paramètres...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration générale de la plateforme Jeff de Bruges
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestion des régions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Régions
                </CardTitle>
                <CardDescription>
                  Gérez les régions géographiques
                </CardDescription>
              </div>
              <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle région
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>Créer une région</DialogTitle>
                    <DialogDescription>
                      Ajoutez une nouvelle région géographique
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="region-name">Nom de la région</Label>
                      <Input
                        id="region-name"
                        value={newRegionName}
                        onChange={(e) => setNewRegionName(e.target.value)}
                        placeholder="Île-de-France"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                      <Button variant="outline" onClick={() => setRegionDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateRegion}>
                        Créer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {regions.length > 0 ? (
              <div className="space-y-2">
                {regions.map((region) => (
                  <div key={region.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{region.name}</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune région configurée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paramètres système */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Paramètres système
            </CardTitle>
            <CardDescription>
              Configuration générale de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="default-margin">Marge par défaut (%)</Label>
              <Input
                id="default-margin"
                type="number"
                min="0"
                max="100"
                value={systemSettings.default_margin}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  default_margin: Number(e.target.value)
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Marge appliquée par défaut aux nouvelles campagnes
              </p>
            </div>
            
            <div>
              <Label htmlFor="campaign-duration">Durée max des campagnes (jours)</Label>
              <Input
                id="campaign-duration"
                type="number"
                min="1"
                value={systemSettings.max_campaign_duration}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  max_campaign_duration: Number(e.target.value)
                })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Notifications email</h4>
                <p className="text-sm text-muted-foreground">
                  Envoyer des notifications automatiques
                </p>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.email_notifications}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  email_notifications: e.target.checked
                })}
                className="toggle"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Approbation auto des écoles</h4>
                <p className="text-sm text-muted-foreground">
                  Approuver automatiquement les nouvelles écoles
                </p>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.auto_approve_schools}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  auto_approve_schools: e.target.checked
                })}
                className="toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistiques générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Statistiques générales
            </CardTitle>
            <CardDescription>
              Vue d'ensemble de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">Magasins</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">45</div>
                <div className="text-sm text-muted-foreground">Écoles</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">127</div>
                <div className="text-sm text-muted-foreground">Utilisateurs</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Campagnes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Paramètres de sécurité et accès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Authentification à deux facteurs</h4>
                <p className="text-sm text-muted-foreground">
                  Obligatoire pour les comptes administrateurs
                </p>
              </div>
              <Badge variant="secondary">Bientôt</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Sessions actives</h4>
                <p className="text-sm text-muted-foreground">
                  Gérer les sessions utilisateurs
                </p>
              </div>
              <Button variant="outline" size="sm">
                Voir les sessions
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Journaux d'audit</h4>
                <p className="text-sm text-muted-foreground">
                  Historique des actions importantes
                </p>
              </div>
              <Button variant="outline" size="sm">
                Consulter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions système */}
      <Card>
        <CardHeader>
          <CardTitle>Actions système</CardTitle>
          <CardDescription>
            Outils d'administration avancés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <h4 className="font-medium mb-1">Sauvegarde des données</h4>
                <p className="text-sm text-muted-foreground">
                  Exporter toutes les données
                </p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <h4 className="font-medium mb-1">Rapport d'activité</h4>
                <p className="text-sm text-muted-foreground">
                  Générer un rapport mensuel
                </p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <h4 className="font-medium mb-1">Maintenance</h4>
                <p className="text-sm text-muted-foreground">
                  Outils de maintenance système
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}