import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Edit, MapPin, School } from "lucide-react";

interface Store {
  id: string;
  name: string;
  address: string;
  created_at: string;
  region_id: string;
}

interface Region {
  id: string;
  name: string;
}

export default function StoreDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region_id: ""
  });

  const fetchStore = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le magasin"
      });
      navigate('/stores');
    } else {
      setStore(data);
      setFormData({
        name: data.name,
        address: data.address || "",
        region_id: data.region_id || ""
      });
    }
  };

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
  };

  useEffect(() => {
    Promise.all([fetchStore(), fetchRegions()]).then(() => {
      setLoading(false);
    });
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('stores')
      .update({
        name: formData.name,
        address: formData.address,
        region_id: formData.region_id || null
      })
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le magasin"
      });
    } else {
      toast({
        title: "Succès",
        description: "Magasin modifié avec succès"
      });
      setEditing(false);
      fetchStore();
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le magasin"
      });
    } else {
      toast({
        title: "Succès",
        description: "Magasin supprimé avec succès"
      });
      navigate('/stores');
    }
  };

  if (!profile || profile.role !== 'siege') {
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
        <div>Chargement du magasin...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Magasin introuvable</h3>
        <Button onClick={() => navigate('/stores')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux magasins
        </Button>
      </div>
    );
  }

  const currentRegion = regions.find(r => r.id === store.region_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/stores')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{store.name}</h1>
            <p className="text-muted-foreground">Détails du magasin partenaire</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editing ? "Annuler" : "Modifier"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce magasin ? Cette action est irréversible et supprimera également toutes les écoles associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Modifier le magasin</CardTitle>
            <CardDescription>Modifiez les informations du magasin partenaire</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du magasin</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jeff de Bruges Paris"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Rue de Rivoli, Paris"
                />
              </div>
              
              <div>
                <Label htmlFor="region">Région</Label>
                <select
                  id="region"
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Sauvegarder</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informations générales</CardTitle>
                <Badge variant="default">Actif</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
                  <p className="mt-1">{store.address || "Adresse non renseignée"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Région</Label>
                <p className="mt-1">{currentRegion?.name || "Région non définie"}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
                <p className="mt-1">{new Date(store.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Écoles partenaires</Label>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Campagnes actives</Label>
                <p className="text-2xl font-bold">0</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Commandes ce mois</Label>
                <p className="text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}