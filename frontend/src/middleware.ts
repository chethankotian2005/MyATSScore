import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Firebase auth state is handled client-side via useAuth hook
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
