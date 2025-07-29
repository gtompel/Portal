import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function checkApiAuth(request: NextRequest): Promise<{ authorized: boolean; userId?: string; response?: NextResponse }> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    
    return { authorized: true, userId: token.sub }
  } catch (error) {
    console.error("Auth check error:", error)
    return { 
      authorized: false, 
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
} 