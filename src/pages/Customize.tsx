import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Palette, Upload, MessageCircle, Euro, Save } from "lucide-react";

export default function Customize() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolData, setSchoolData] = useState({
    name: "",
    custom_message: "",
    margin_explanation: "",
    logo_url: "",
    contact_email: ""
  });

  const fetchSchoolData = async () => {
    if (!profile?.school_id) return;

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données de l'école"
      });
    } else if (data) {
      setSchoolData({
        name: data.name || "",
        custom_message: data.custom_message || "",
        margin_explanation: data.margin_explanation || "",
        logo_url: data.logo_url || "",
        contact_email: data.contact_email || ""
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchoolData();
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.school_id) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('schools')
      .update(schoolData)
      .eq('id', profile.school_id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications"
      });
    } else {
      toast({
        title: "Succès",
        description: "Configuration sauvegardée avec succès"
      });
    }
    setSaving(false);
  };

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
        <div>Chargement de la configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Personnalisation</h1>
          <p className="text-muted-foreground">
            Configurez votre boutique scolaire pour les parents
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration générale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Configurez les informations de base de votre école
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'école</Label>
              <Input
                id="name"
                value={schoolData.name}
                onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                placeholder="École Primaire Saint-Joseph"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email de contact</Label>
              <Input
                id="contact_email"
                type="email"
                value={schoolData.contact_email}
                onChange={(e) => setSchoolData({ ...schoolData, contact_email: e.target.value })}
                placeholder="contact@ecole.fr"
              />
            </div>
            <div>
              <Label htmlFor="logo_url">URL du logo</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  value={schoolData.logo_url}
                  onChange={(e) => setSchoolData({ ...schoolData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu de la boutique */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de votre boutique</CardTitle>
            <CardDescription>
              Voici comment les parents verront votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                {schoolData.logo_url && (
                  <img 
                    src={schoolData.logo_url} 
                    alt="Logo"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h3 className="font-semibold">
                    Boutique {schoolData.name || "Votre école"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {schoolData.contact_email || "contact@ecole.fr"}
                  </p>
                </div>
              </div>
              {schoolData.custom_message && (
                <div className="bg-background rounded p-3">
                  <p className="text-sm">{schoolData.custom_message}</p>
                </div>
              )}
              {schoolData.margin_explanation && (
                <div className="bg-background rounded p-3">
                  <p className="text-sm font-medium text-primary">
                    💡 {schoolData.margin_explanation}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message d'accueil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message d'accueil
            </CardTitle>
            <CardDescription>
              Message affiché aux parents sur votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={schoolData.custom_message}
              onChange={(e) => setSchoolData({ ...schoolData, custom_message: e.target.value })}
              placeholder="Bienvenue dans la boutique de notre école ! Vos achats nous aident à financer nos projets éducatifs..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Ce message apparaîtra en haut de votre boutique pour expliquer le projet aux parents.
            </p>
          </CardContent>
        </Card>

        {/* Explication des revenus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Utilisation des revenus
            </CardTitle>
            <CardDescription>
              Expliquez comment les revenus seront utilisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={schoolData.margin_explanation}
              onChange={(e) => setSchoolData({ ...schoolData, margin_explanation: e.target.value })}
              placeholder="Les revenus de cette vente financeront notre sortie scolaire au château de Versailles..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Soyez transparent sur l'utilisation des fonds pour rassurer les parents.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration avancée */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration avancée</CardTitle>
          <CardDescription>
            Paramètres supplémentaires pour votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Notifications par email</h4>
              <p className="text-sm text-muted-foreground">
                Recevoir un email à chaque nouvelle commande
              </p>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Boutique publique</h4>
              <p className="text-sm text-muted-foreground">
                Permettre aux visiteurs de voir votre boutique
              </p>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Afficher les objectifs</h4>
              <p className="text-sm text-muted-foreground">
                Montrer le montant collecté et l'objectif
              </p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Commentaires clients</h4>
              <p className="text-sm text-muted-foreground">
                Permettre aux parents de laisser des avis
              </p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}