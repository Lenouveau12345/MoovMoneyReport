'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Home, 
  BarChart3, 
  History, 
  Database, 
  Upload, 
  Download,
  Settings,
  X,
  TrendingUp,
  Users,
  DollarSign,
  LogOut,
  User
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  {
    name: 'Accueil',
    href: '/',
    icon: Home,
    description: 'Tableau de bord principal'
  },
  {
    name: 'Import CSV',
    href: '/import-csv',
    icon: Upload,
    description: 'Importer des fichiers CSV'
  },
  {
    name: 'Import 2 Étapes',
    href: '/import-two-steps',
    icon: Database,
    description: 'Upload puis traitement'
  },
  {
    name: 'Rapport Périodique',
    href: '/rapport-periodique',
    icon: BarChart3,
    description: 'Analyses et rapports'
  },
  {
    name: 'Tendances',
    href: '/tendances',
    icon: TrendingUp,
    description: 'Évolutions par type vs période précédente'
  },
  {
    name: 'Historique des Imports',
    href: '/historique-imports',
    icon: History,
    description: 'Historique des imports'
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Database,
    description: 'Consulter les transactions'
  }
];

const quickActions = [
  {
    name: 'Importer CSV',
    icon: Upload,
    action: 'import',
    href: '/import-csv'
  },
  {
    name: 'Consulter Transactions',
    icon: Database,
    action: 'transactions',
    href: '/transactions'
  },
  {
    name: 'Voir Tendances',
    icon: TrendingUp,
    action: 'trends',
    href: '/tendances'
  },
  {
    name: 'Rapport Périodique',
    icon: BarChart3,
    action: 'report',
    href: '/rapport-periodique'
  }
];

interface StatsData {
  totalTransactions: number;
  totalImportSessions: number;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData>({ totalTransactions: 0, totalImportSessions: 0 });

  const fetchStats = async () => {
    try {
      const ts = Date.now();
      const response = await fetch(`/api/stats/total-transactions?t=${ts}`, { cache: 'no-store' });
      const data = await response.json();
      // S'assurer que les données ont la structure attendue
      setStats({
        totalTransactions: data.totalTransactions || 0,
        totalImportSessions: data.totalImportSessions || 0
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      // En cas d'erreur, garder les valeurs par défaut
      setStats({ totalTransactions: 0, totalImportSessions: 0 });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Rafraîchir quand la route change
  useEffect(() => {
    fetchStats();
  }, [pathname]);

  // Rafraîchir toutes les 15s et quand l'onglet reprend le focus
  useEffect(() => {
    const interval = setInterval(fetchStats, 15000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchStats();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Réagir aux signaux globaux via localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'statsRefresh') fetchStats();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleQuickAction = (action: string, href?: string) => {
    if (href) {
      router.push(href);
      // Fermer la sidebar sur mobile après navigation
      if (window.innerWidth < 1024) {
        onToggle();
      }
    } else {
      switch (action) {
        case 'import':
          router.push('/');
          break;
        case 'transactions':
          router.push('/transactions');
          break;
        case 'trends':
          router.push('/tendances');
          break;
        case 'report':
          router.push('/rapport-periodique');
          break;
        default:
          console.log('Action rapide inconnue:', action);
      }
    }
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header de la sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MOOV MONEY REPORT</h1>
              <p className="text-xs text-gray-500">Tableau de bord</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`
                    mr-3 flex-shrink-0 w-5 h-5
                    ${isActive ? 'text-orange-700' : 'text-gray-400 group-hover:text-gray-600'}
                  `} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Actions rapides */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Actions rapides
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  onClick={() => handleQuickAction(action.action, action.href)}
                  className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                >
                  <action.icon className="mr-3 flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                  {action.name}
                </button>
              ))}
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="px-3 py-2 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-900">Transactions</span>
                  </div>
                  <span className="text-sm font-bold text-orange-700">
                    {stats?.totalTransactions?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-700 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Imports</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    {stats?.totalImportSessions?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer de la sidebar */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* Informations utilisateur */}
          {session?.user && (
            <div className="px-3 py-2 bg-orange-50 rounded-lg mb-2">
              <div className="flex items-center">
                <User className="w-4 h-4 text-orange-600 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-900 truncate">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-xs text-orange-600 truncate">
                    {session.user.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200">
            <Settings className="mr-3 flex-shrink-0 w-5 h-5 text-gray-400" />
            Paramètres
          </button>
          
          {session?.user && (
            <button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 hover:text-red-900 transition-colors duration-200"
            >
              <LogOut className="mr-3 flex-shrink-0 w-5 h-5 text-red-400" />
              Se déconnecter
            </button>
          )}
        </div>
      </div>
    </>
  );
}
