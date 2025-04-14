'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'firebase/auth'
import { clientAuth } from '@/lib/firebase/client'
import { useRouter } from 'next/navigation'

interface SignOutButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function SignOutButton({
  variant = 'default',
  size = 'default',
  className = '',
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      console.log('Starting sign-out process...')

      // 1. Clear the session cookie via API first
      // This ensures even if Firebase sign-out fails, the session is cleared
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to clear session cookie:', await response.text())
        throw new Error('Failed to clear session')
      }

      console.log('Session cookie cleared successfully')

      // 2. Sign out from Firebase client
      // Even if this fails, the cookie is already cleared
      await signOut(clientAuth)
      console.log('Firebase sign-out completed')

      // 3. Redirect to sign-in page
      // Small delay to ensure all processes complete
      setTimeout(() => {
        console.log('Redirecting to sign-in page...')
        router.push('/signin')
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Error during sign-out process:', error)
      // Still try to redirect even if there's an error
      router.push('/signin')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
