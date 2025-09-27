'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'USER'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // En cours de chargement

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push('/')
      return
    }
  }, [session, status, router, requiredRole])

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
    )
  }

  if (!session) {
    return null
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-orange-100 mb-8">Vous n'avez pas les permissions nécessaires</p>
          
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="space-y-4">
              <p className="text-gray-700">
                Cette page nécessite le rôle <span className="font-semibold text-black">{requiredRole}</span>.
              </p>
              <p className="text-sm text-gray-600">
                Votre rôle actuel : <span className="font-semibold">{session.user.role}</span>
              </p>
              <button
                onClick={() => window.history.back()}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
