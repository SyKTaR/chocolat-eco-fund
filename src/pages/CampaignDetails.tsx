import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Calendar, Percent, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  margin_percentage: number;
  is_active: boolean;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
}

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [manageStoresOpen, setManageStoresOpen] = useState(false);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [participatingStores, setParticipatingStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    margin_percentage: 20,
    is_active: true
  });

  useEffect(() => {
    if (id) {
      fetchCampaign();
      fetchStores();
      fetchParticipatingStores();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setCampaign(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        start_date: data.start_date.split('T')[0],
        end_date: data.end_date.split('T')[0],
        margin_percentage: data.margin_percentage,
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la campagne",
      });
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchParticipatingStores = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_stores')
        .select(`
          store_id,
          stores (
            id,
            name,
            address
          )
        `)
        .eq('campaign_id', id)
        .eq('is_active', true);

      if (error) throw error;
      
      const stores = data?.map(cs => cs.stores).filter(Boolean) || [];
      setParticipatingStores(stores as Store[]);
      setSelectedStoreIds(stores.map(s => s.id));
    } catch (error) {
      console.error('Error fetching participating stores:', error);
    }
  };

  const handleStoreSelection = async () => {
    try {
      // Supprimer toutes les associations existantes
      await supabase
        .from('campaign_stores')
        .delete()
        .eq('campaign_id', id);

      // Ajouter les nouvelles associations
      if (selectedStoreIds.length > 0) {
        const insertData = selectedStoreIds.map(storeId => ({
          campaign_id: id,
          store_id: storeId,
          is_active: true
        }));

        const { error } = await supabase
          .from('campaign_stores')
          .insert(insertData);

        if (error) throw error;
      }

      toast({
        title: "Magasins mis à jour",
        description: "La sélection des magasins a été mise à jour avec succès",
      });

      setManageStoresOpen(false);
      fetchParticipatingStores();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          margin_percentage: formData.margin_percentage,
          is_active: formData.is_active
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Campagne mise à jour",
        description: "La campagne a été modifiée avec succès",
      });

      setEditing(false);
      fetchCampaign();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Campagne supprimée",
        description: "La campagne a été supprimée avec succès",
      });

      navigate('/campaigns');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  if (!profile || profile.role !== 'siege') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Accès non autorisé</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Campagne introuvable</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux campagnes
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground mt-1">Détails de la campagne</p>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Modifier la campagne</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la campagne</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="margin">Marge pour les écoles (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.margin_percentage}
                  onChange={(e) => setFormData({ ...formData, margin_percentage: Number(e.target.value) })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit">Sauvegarder</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
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
                  <AlertDialogTitle>Supprimer la campagne</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1">{campaign.description || 'Aucune description'}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Période</Label>
                    <p className="mt-1">
                      Du {new Date(campaign.start_date).toLocaleDateString('fr-FR')} au {new Date(campaign.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Marge écoles</Label>
                    <p className="mt-1">{campaign.margin_percentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Magasins participants
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setManageStoresOpen(true)}
                    >
                      Gérer
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{participatingStores.length}</p>
                  <p className="text-muted-foreground">magasins</p>
                  {participatingStores.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {participatingStores.slice(0, 3).map((store) => (
                        <div key={store.id} className="text-sm">
                          <p className="font-medium">{store.name}</p>
                          <p className="text-muted-foreground">{store.address}</p>
                        </div>
                      ))}
                      {participatingStores.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          et {participatingStores.length - 3} autres...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Écoles participantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground">écoles</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for managing participating stores */}
      <Dialog open={manageStoresOpen} onOpenChange={setManageStoresOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer les magasins participants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={selectedStoreIds.length === allStores.length ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedStoreIds.length === allStores.length) {
                    setSelectedStoreIds([]);
                  } else {
                    setSelectedStoreIds(allStores.map(s => s.id));
                  }
                }}
              >
                {selectedStoreIds.length === allStores.length ? "Désélectionner tout" : "Sélectionner tout"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedStoreIds.length} / {allStores.length} magasins sélectionnés
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {allStores.map((store) => (
                <div key={store.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedStoreIds.includes(store.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStoreIds([...selectedStoreIds, store.id]);
                      } else {
                        setSelectedStoreIds(selectedStoreIds.filter(id => id !== store.id));
                      }
                    }}
                  />
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-muted-foreground">{store.address}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleStoreSelection} className="flex-1">
                Sauvegarder la sélection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setManageStoresOpen(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}