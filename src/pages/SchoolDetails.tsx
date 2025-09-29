import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Users, ShoppingBag, Mail, Plus, Send } from "lucide-react";

interface School {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  custom_message: string;
  margin_explanation: string;
  store_id: string;
  created_at: string;
}

interface ParentInvitation {
  id: string;
  parent_email: string;
  parent_name: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Order {
  id: string;
  parent_name: string;
  parent_email: string;
  total_amount: number;
  margin_amount: number;
  status: string;
  created_at: string;
}

export default function SchoolDetails() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invitations, setInvitations] = useState<ParentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    parent_email: "",
    parent_name: ""
  });

  const fetchSchoolDetails = async () => {
    if (!schoolId) return;

    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (schoolError) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les détails de l'école"
      });
      return;
    }

    setSchool(schoolData);

    // Fetch orders for this school
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (!ordersError) {
      setOrders(ordersData || []);
    }

    // Fetch invitations if user is school admin
    if (profile?.role === 'ecole' && profile.school_id === schoolId) {
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('parent_invitations')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (!invitationsError) {
        setInvitations(invitationsData || []);
      }
    }
  };

  useEffect(() => {
    fetchSchoolDetails().then(() => setLoading(false));
  }, [schoolId, profile]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !profile) return;

    const invitationCode = Math.random().toString(36).substring(2, 15);

    const { error } = await supabase
      .from('parent_invitations')
      .insert([{
        school_id: school.id,
        invited_by: profile.id,
        parent_email: inviteForm.parent_email,
        parent_name: inviteForm.parent_name,
        invitation_code: invitationCode
      }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation"
      });
    } else {
      toast({
        title: "Invitation envoyée",
        description: `Invitation envoyée à ${inviteForm.parent_email}`
      });
      setInviteDialogOpen(false);
      setInviteForm({ parent_email: "", parent_name: "" });
      fetchSchoolDetails();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'completed': return 'success';
      case 'accepted': return 'success';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!profile) {
    return <div className="flex items-center justify-center min-h-[400px]">Chargement...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Chargement des détails...</div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">École non trouvée</h3>
        <Button onClick={() => navigate('/schools')}>
          Retour aux écoles
        </Button>
      </div>
    );
  }

  const isSchoolAdmin = profile.role === 'ecole' && profile.school_id === school.id;
  const canViewDetails = isSchoolAdmin || 
    profile.role === 'siege' || 
    (profile.role === 'magasin' && profile.store_id === school.store_id);

  if (!canViewDetails) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
        <p className="text-muted-foreground mb-4">
          Vous n'avez pas l'autorisation de voir ces détails.
        </p>
        <Button onClick={() => navigate('/schools')}>
          Retour aux écoles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/schools')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{school.name}</h1>
          </div>
          <p className="text-muted-foreground">{school.address}</p>
        </div>

        {isSchoolAdmin && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Inviter des parents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Inviter un parent</DialogTitle>
                <DialogDescription>
                  Envoyez une invitation à un parent pour rejoindre la boutique de l'école
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="parent_email">Email du parent</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={inviteForm.parent_email}
                    onChange={(e) => setInviteForm({ ...inviteForm, parent_email: e.target.value })}
                    placeholder="parent@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="parent_name">Nom du parent (optionnel)</Label>
                  <Input
                    id="parent_name"
                    value={inviteForm.parent_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, parent_name: e.target.value })}
                    placeholder="Marie Dupont"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          {isSchoolAdmin && <TabsTrigger value="parents">Parents</TabsTrigger>}
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total des commandes reçues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus générés</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.reduce((sum, order) => sum + order.margin_amount, 0).toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground">
                  Pour les projets de l'école
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parents participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(orders.map(order => order.parent_email)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Familles ayant commandé
                </p>
              </CardContent>
            </Card>
          </div>

          {school.custom_message && (
            <Card>
              <CardHeader>
                <CardTitle>Message personnalisé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{school.custom_message}</p>
              </CardContent>
            </Card>
          )}

          {school.margin_explanation && (
            <Card>
              <CardHeader>
                <CardTitle>Utilisation des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{school.margin_explanation}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-muted-foreground">
                  Les commandes des parents apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{order.parent_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {order.parent_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Badge variant="default">
                          {order.status === 'pending' ? 'En attente' :
                           order.status === 'completed' ? 'Terminée' :
                           order.status}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">{order.total_amount.toFixed(2)} €</div>
                          <div className="text-sm text-green-600">
                            +{order.margin_amount.toFixed(2)} € pour l'école
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isSchoolAdmin && (
          <TabsContent value="parents" className="space-y-4">
            {invitations.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune invitation</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par inviter des parents à rejoindre la boutique.
                  </p>
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Première invitation
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {invitation.parent_name || invitation.parent_email}
                          </div>
                          {invitation.parent_name && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {invitation.parent_email}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Invité le {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <Badge variant="default">
                            {invitation.status === 'pending' ? 'En attente' :
                             invitation.status === 'accepted' ? 'Acceptée' :
                             invitation.status === 'expired' ? 'Expirée' :
                             invitation.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'école</CardTitle>
              <CardDescription>
                Détails de contact et configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom de l'école</Label>
                <div className="text-sm text-muted-foreground mt-1">{school.name}</div>
              </div>
              <div>
                <Label>Adresse</Label>
                <div className="text-sm text-muted-foreground mt-1">{school.address || "Non renseignée"}</div>
              </div>
              <div>
                <Label>Email de contact</Label>
                <div className="text-sm text-muted-foreground mt-1">{school.contact_email || "Non renseigné"}</div>
              </div>
              <div>
                <Label>Date de création</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(school.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}