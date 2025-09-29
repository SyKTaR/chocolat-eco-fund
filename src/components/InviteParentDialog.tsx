import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Mail, User, Loader2 } from "lucide-react";
import { z } from "zod";

const inviteSchema = z.object({
  parent_name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom est trop long"),
  parent_email: z.string().trim().email("Email invalide").max(255, "Email trop long")
});

interface InviteParentDialogProps {
  schoolId: string;
  invitedBy: string;
  onInviteSent?: () => void;
}

export default function InviteParentDialog({ schoolId, invitedBy, onInviteSent }: InviteParentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parent_name: "",
    parent_email: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateInvitationCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const validateForm = () => {
    try {
      inviteSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if parent already exists
      const { data: existingInvitation } = await supabase
        .from('parent_invitations')
        .select('id')
        .eq('school_id', schoolId)
        .eq('parent_email', formData.parent_email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        toast({
          variant: "destructive",
          title: "Invitation déjà envoyée",
          description: "Une invitation est déjà en cours pour cette adresse email."
        });
        return;
      }

      // Create invitation
      const { error } = await supabase
        .from('parent_invitations')
        .insert([{
          school_id: schoolId,
          parent_name: formData.parent_name.trim(),
          parent_email: formData.parent_email.toLowerCase().trim(),
          invited_by: invitedBy,
          invitation_code: generateInvitationCode(),
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Invitation envoyée !",
        description: `Une invitation a été envoyée à ${formData.parent_email}`
      });

      setFormData({ parent_name: "", parent_email: "" });
      setOpen(false);
      onInviteSent?.();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Inviter des parents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un parent
          </DialogTitle>
          <DialogDescription>
            Invitez un parent à rejoindre la plateforme pour cette école.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom du parent
            </Label>
            <Input
              id="parent_name"
              type="text"
              placeholder="Ex: Marie Dupont"
              value={formData.parent_name}
              onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              className={errors.parent_name ? "border-destructive" : ""}
              disabled={loading}
            />
            {errors.parent_name && (
              <p className="text-sm text-destructive">{errors.parent_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email du parent
            </Label>
            <Input
              id="parent_email"
              type="email"
              placeholder="marie.dupont@email.com"
              value={formData.parent_email}
              onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
              className={errors.parent_email ? "border-destructive" : ""}
              disabled={loading}
            />
            {errors.parent_email && (
              <p className="text-sm text-destructive">{errors.parent_email}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 sm:flex-none"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}