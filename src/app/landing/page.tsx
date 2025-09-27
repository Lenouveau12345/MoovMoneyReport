'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TrendingUp, ArrowRight, Shield, BarChart3, Database } from 'lucide-react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Si l'utilisateur est connecté, rediriger vers l'accueil
    if (session) {
      router.push('/')
    }
  }, [session, router])

  // Si en cours de chargement ou connecté, ne rien afficher
  if (status === 'loading' || session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border-2 border-white/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MOOV MONEY REPORT</span>
          </div>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg border-2 border-white/30 transition-all duration-300 flex items-center gap-2"
          >
            Se connecter
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            Tableau de Bord des Transactions
          </h1>
          <p className="text-xl text-orange-100 mb-8">
            Analysez et gérez vos transactions financières MOOV Money avec des rapports détaillés et des statistiques en temps réel.
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            Accéder au Tableau de Bord
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Rapports Détaillés</h3>
            <p className="text-orange-100">
              Générez des rapports périodiques et analysez les tendances de vos transactions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Import CSV</h3>
            <p className="text-orange-100">
              Importez facilement vos données CSV et synchronisez votre base de données.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Sécurisé</h3>
            <p className="text-orange-100">
              Vos données sont protégées avec une authentification sécurisée et un accès contrôlé.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-orange-100">
            © 2024 MOOV MONEY REPORT - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
