'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Il y a un problème avec la configuration du serveur.'
      case 'AccessDenied':
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      case 'Verification':
        return 'Le token a expiré ou a déjà été utilisé.'
      case 'Default':
        return 'Une erreur inattendue s\'est produite.'
      default:
        return 'Une erreur d\'authentification s\'est produite.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* Logo et titre */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Erreur d'authentification</h1>
          <p className="text-orange-100">Une erreur s'est produite lors de la connexion</p>
        </div>

        {/* Carte d'erreur */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Oups !</h2>
              <p className="text-gray-700">
                {getErrorMessage(error)}
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Réessayer la connexion
              </Link>

              <Link
                href="/"
                className="w-full h-12 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Si le problème persiste, contactez l'administrateur
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
