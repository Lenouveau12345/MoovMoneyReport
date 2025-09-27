'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'loading') return; // En cours de chargement

    // Si on est sur une page d'authentification ou la page landing, ne pas rediriger
    if (pathname.startsWith('/auth/') || pathname === '/landing') return;

    // Si pas de session, rediriger vers la page d'accueil publique
    if (!session) {
      router.push('/landing');
    }
  }, [session, status, router, pathname]);

  // Afficher un écran de chargement pendant la vérification
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Chargement...</h2>
          <p className="text-orange-100">Vérification de votre session</p>
        </div>
      </div>
    );
  }

  // Si pas de session et pas sur une page d'auth ou landing, ne rien afficher (redirection en cours)
  if (!session && !pathname.startsWith('/auth/') && pathname !== '/landing') {
    return null;
  }

  // Si on est sur une page d'authentification ou landing, afficher sans la sidebar
  if (pathname.startsWith('/auth/') || pathname === '/landing') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Contenu principal */}
      <div className="lg:ml-80">
        {/* Header mobile */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="font-semibold text-gray-900">Moov Money</span>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <main className="min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
