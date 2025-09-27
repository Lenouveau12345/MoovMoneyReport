'use client'

import { useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TrendingUp, LogOut } from 'lucide-react'

export default function SignOut() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers la page de connexion après 3 secondes
    const timer = setTimeout(() => {
      router.push('/auth/signin')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* Logo et titre */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <LogOut className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Déconnexion</h1>
          <p className="text-orange-100">Vous allez être redirigé vers la page de connexion</p>
        </div>

        {/* Carte de confirmation */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-6">
            {session?.user && (
              <div className="text-center">
                <p className="text-gray-700 mb-2">
                  Au revoir, <span className="font-semibold text-black">{session.user.name || session.user.email}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Vous avez été déconnecté avec succès
                </p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter maintenant
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full h-12 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg transition-all duration-300"
              >
                Retour à l'accueil
              </button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Redirection automatique dans 3 secondes...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
