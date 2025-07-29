import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        }
      })
    } else {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session'
      })
    }
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to check authentication status'
    }, { status: 500 })
  }
} 