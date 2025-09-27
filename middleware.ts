import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Rediriger vers la page d'accueil publique si pas de token
    if (!req.nextauth.token && !req.nextUrl.pathname.startsWith('/auth/') && req.nextUrl.pathname !== '/landing') {
      return Response.redirect(new URL('/landing', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Autoriser l'accès aux pages publiques
        if (req.nextUrl.pathname.startsWith('/auth/') || req.nextUrl.pathname === '/landing') {
          return true
        }
        
        // Vérifier si l'utilisateur est connecté pour les autres pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
