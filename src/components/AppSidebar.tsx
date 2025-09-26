import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  School,
  ShoppingBag,
  BarChart3,
  Settings,
  Package,
  Users,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const menuItems = {
  siege: [
    { title: "Tableau de bord", url: "/dashboard", icon: BarChart3 },
    { title: "Campagnes", url: "/campaigns", icon: Package },
    { title: "Magasins", url: "/stores", icon: Store },
    { title: "Écoles", url: "/schools", icon: School },
    { title: "Paramètres", url: "/settings", icon: Settings },
  ],
  magasin: [
    { title: "Tableau de bord", url: "/dashboard", icon: BarChart3 },
    { title: "Campagnes", url: "/campaigns", icon: Package },
    { title: "Mes écoles", url: "/schools", icon: School },
    { title: "Commandes", url: "/orders", icon: ShoppingBag },
  ],
  ecole: [
    { title: "Ma boutique", url: "/shop", icon: Store },
    { title: "Personnalisation", url: "/customize", icon: Settings },
    { title: "Mes ventes", url: "/sales", icon: BarChart3 },
    { title: "Commandes", url: "/orders", icon: ShoppingBag },
  ],
  parent: [
    { title: "Boutiques", url: "/schools", icon: School },
    { title: "Mes commandes", url: "/orders", icon: ShoppingBag },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) {
    return null;
  }

  const items = menuItems[profile.role] || [];
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Building2 className="h-4 w-4 mr-2" />
            {!isCollapsed && "Menu principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}