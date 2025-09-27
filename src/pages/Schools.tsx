import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, School, MapPin, Mail, Users, ShoppingBag } from "lucide-react";

interface SchoolData {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  logo_url: string;
  custom_message: string;
  margin_explanation: string;
  store_id: string;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
}

export default function Schools() {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_email: "",
    custom_message: "",
    margin_explanation: "",
    store_id: ""
  });

  const fetchSchools = async () => {
    let query = supabase.from('schools').select('*');
    
    // Filter by user role
    if (profile?.role === 'magasin' && profile.store_id) {
      query = query.eq('store_id', profile.store_id);
    } else if (profile?.role === 'ecole' && profile.school_id) {
      query = query.eq('id', profile.school_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les écoles"
      });
    } else {
      setSchools(data || []);
    }
  };

  const fetchStores = async () => {
    if (profile?.role === 'siege') {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching stores:', error);
      } else {
        setStores(data || []);
      }
    }
  };

  useEffect(() => {
    Promise.all([fetchSchools(), fetchStores()]).then(() => {
      setLoading(false);
    });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let dataToInsert = { ...formData };
    
    // Auto-assign store_id for magasin role
    if (profile?.role === 'magasin' && profile.store_id) {
      dataToInsert.store_id = profile.store_id;
    }

    const { error } = await supabase
      .from('schools')
      .insert([dataToInsert]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer l'école"
      });
    } else {
      toast({
        title: "Succès",
        description: "École créée avec succès"
      });
      setDialogOpen(false);
      setFormData({
        name: "",
        address: "",
        contact_email: "",
        custom_message: "",
        margin_explanation: "",
        store_id: ""
      });
      fetchSchools();
    }
  };

  const canManageSchools = profile?.role === 'siege' || profile?.role === 'magasin';

  if (!profile) {
    return <div>Chargement...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement des écoles...</div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (profile.role) {
      case 'siege':
        return "Toutes les écoles";
      case 'magasin':
        return "Mes écoles partenaires";
      case 'ecole':
        return "Mon école";
      case 'parent':
        return "Boutiques d'écoles";
      default:
        return "Écoles";
    }
  };

  const getPageDescription = () => {
    switch (profile.role) {
      case 'siege':
        return "Gérez toutes les écoles du réseau";
      case 'magasin':
        return "Gérez vos écoles partenaires et leurs boutiques";
      case 'ecole':
        return "Informations et configuration de votre école";
      case 'parent':
        return "Découvrez les boutiques des écoles disponibles";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-muted-foreground">{getPageDescription()}</p>
        </div>
        
        {canManageSchools && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle école
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter une école</DialogTitle>
                <DialogDescription>
                  Enregistrez une nouvelle école partenaire
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de l'école</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="École Primaire Saint-Joseph"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Rue de l'École, Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@ecole.fr"
                  />
                </div>
                {profile.role === 'siege' && (
                  <div>
                    <Label htmlFor="store">Magasin partenaire</Label>
                    <select
                      id="store"
                      value={formData.store_id}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      required
                    >
                      <option value="">Sélectionner un magasin</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label htmlFor="custom_message">Message personnalisé</Label>
                  <Textarea
                    id="custom_message"
                    value={formData.custom_message}
                    onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                    placeholder="Message d'accueil pour les parents..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="margin_explanation">Explication des revenus</Label>
                  <Textarea
                    id="margin_explanation"
                    value={formData.margin_explanation}
                    onChange={(e) => setFormData({ ...formData, margin_explanation: e.target.value })}
                    placeholder="Comment les revenus seront utilisés..."
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer l'école</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <Card key={school.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <School className="h-5 w-5 text-primary" />
                <Badge variant="default">Active</Badge>
              </div>
              <CardTitle className="text-lg">{school.name}</CardTitle>
              {school.address && (
                <CardDescription className="text-sm flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {school.address}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {school.contact_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{school.contact_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Parents inscrits: 0</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingBag className="h-4 w-4" />
                <span>Commandes: 0</span>
              </div>
              {school.custom_message && (
                <p className="text-sm text-muted-foreground italic">
                  "{school.custom_message.substring(0, 100)}..."
                </p>
              )}
              <div className="pt-2 flex flex-col gap-2 md:flex-row">
                {profile.role === 'parent' ? (
                  <Button size="sm" className="flex-1">
                    Visiter la boutique
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1">
                      Détails
                    </Button>
                    {profile.role === 'ecole' && (
                      <Button size="sm" className="flex-1">
                        Boutique
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <School className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {profile.role === 'parent' ? "Aucune boutique disponible" : "Aucune école"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {profile.role === 'parent' 
                ? "Les boutiques d'écoles apparaîtront ici quand elles seront disponibles"
                : canManageSchools 
                ? "Commencez par ajouter des écoles partenaires" 
                : "Aucune école trouvée"}
            </p>
            {canManageSchools && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une école
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}