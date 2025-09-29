import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, School, Mail, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface School {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  custom_message: string;
  logo_url: string;
  margin_explanation: string;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
}

export default function ManageSchools() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_email: '',
    custom_message: '',
    margin_explanation: ''
  });

  useEffect(() => {
    if (storeId) {
      fetchStoreAndSchools();
    }
  }, [storeId]);

  const fetchStoreAndSchools = async () => {
    try {
      // Fetch store info
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Fetch schools for this store
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('schools')
        .insert([{
          ...formData,
          store_id: storeId
        }]);

      if (error) throw error;

      toast({
        title: "École ajoutée",
        description: "L'école a été ajoutée avec succès",
      });

      setDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        contact_email: '',
        custom_message: '',
        margin_explanation: ''
      });
      fetchStoreAndSchools();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!profile || (profile.role !== 'siege' && profile.role !== 'magasin')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Accès non autorisé</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/stores')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux magasins
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Écoles du magasin</h1>
          {store && (
            <p className="text-muted-foreground mt-1">{store.name}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {schools.length} école{schools.length !== 1 ? 's' : ''} trouvée{schools.length !== 1 ? 's' : ''}
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une école
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle école</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de l'école</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="custom_message">Message personnalisé</Label>
                <Textarea
                  id="custom_message"
                  value={formData.custom_message}
                  onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="margin_explanation">Explication de la marge</Label>
                <Textarea
                  id="margin_explanation"
                  value={formData.margin_explanation}
                  onChange={(e) => setFormData({ ...formData, margin_explanation: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Ajouter
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {schools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune école trouvée</h3>
            <p className="text-muted-foreground text-center mb-4">
              Ce magasin n'a pas encore d'écoles partenaires.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              Ajouter la première école
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {school.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {school.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{school.address}</p>
                  </div>
                )}
                {school.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{school.contact_email}</p>
                  </div>
                )}
                {school.custom_message && (
                  <div>
                    <p className="text-sm font-medium mb-1">Message:</p>
                    <p className="text-sm text-muted-foreground">{school.custom_message}</p>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    Ajoutée le {new Date(school.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}