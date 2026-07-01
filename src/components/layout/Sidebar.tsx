import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  Table,
  BarChart2,
  TrendingUp,
  Landmark,
  List,
  PieChart,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Instrucciones', path: '/instrucciones', icon: BookOpen },
  { label: 'Ingreso de Datos', path: '/ingreso', icon: PlusCircle },
  { label: 'Datos', path: '/datos', icon: Table },
  { label: 'Dashboard', path: '/dashboard', icon: BarChart2 },
  { label: 'Flujo de Caja', path: '/flujo-caja', icon: TrendingUp },
  { label: 'Caja y Bancos', path: '/caja-bancos', icon: Landmark },
  { label: 'Lista de Datos', path: '/catalogos', icon: List },
  { label: 'Análisis', path: '/analisis', icon: PieChart },
  { label: 'Pagos Recurrentes', path: '/pagos-recurrentes', icon: RefreshCw },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Finanzas Personales</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export { navItems };
export type { NavItem };
