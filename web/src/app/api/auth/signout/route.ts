import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({ success: true })

    // Clear the session cookie
    response.cookies.delete('session')

    return response
  } catch (error) {
    console.error('Failed to sign out:', error)
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
  }
}
