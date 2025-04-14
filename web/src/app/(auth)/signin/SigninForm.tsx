'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { clientAuth } from '@/lib/firebase/client'
import { useAction } from 'next-safe-action/hooks'
import { signinAction } from './actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Define the form schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function SigninForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Use next-safe-action hook
  const { execute, status, result } = useAction(signinAction, {
    onSuccess: (data) => {
      if (data.data?.success) {
        // The server-side validation has passed, now try client-side sign-in
        handleEmailPasswordSignIn(form.getValues())
      }
    },
    onError: (error) => {
      setErrorMessage(
        error?.error?.serverError || 'An error occurred. Please try again.'
      )
    },
  })

  // Handle validation errors from the result
  const handleValidationErrors = () => {
    if (result?.validationErrors) {
      // Set form errors via react-hook-form
      Object.entries(result.validationErrors).forEach(([field, error]) => {
        // Use type guard to check if error has _errors property
        if (
          error &&
          '_errors' in error &&
          Array.isArray((error as { _errors: string[] })._errors) &&
          (error as { _errors: string[] })._errors.length > 0
        ) {
          // Cast field to keyof z.infer<typeof formSchema>
          form.setError(field as keyof z.infer<typeof formSchema>, {
            message: (error as { _errors: string[] })._errors[0],
          })
        }
      })

      // Find first field with errors
      const firstErrorField = Object.entries(result.validationErrors).find(
        ([, error]) => {
          return (
            typeof error === 'object' &&
            error !== null &&
            '_errors' in error &&
            Array.isArray((error as { _errors: string[] })._errors) &&
            (error as { _errors: string[] })._errors.length > 0
          )
        }
      )

      let firstError = 'Please check your form inputs'
      if (
        firstErrorField &&
        typeof firstErrorField[1] === 'object' &&
        firstErrorField[1] !== null &&
        '_errors' in firstErrorField[1] &&
        Array.isArray((firstErrorField[1] as { _errors: string[] })._errors) &&
        (firstErrorField[1] as { _errors: string[] })._errors.length > 0
      ) {
        firstError = (firstErrorField[1] as { _errors: string[] })._errors[0]
      }

      setErrorMessage(firstError)
    }
  }

  // Check for validation errors when result changes
  useEffect(() => {
    if (result?.validationErrors) {
      handleValidationErrors()
    } else if (result?.serverError) {
      setErrorMessage(result.serverError)
    }
  }, [result])

  const handleEmailPasswordSignIn = async (
    values: z.infer<typeof formSchema>
  ) => {
    setIsSubmitting(true)
    try {
      // Perform client-side Firebase authentication
      const userCredential = await signInWithEmailAndPassword(
        clientAuth,
        values.email,
        values.password
      )

      // Get the ID token
      const idToken = await userCredential.user.getIdToken()

      // Set the session cookie via the API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      // Successful sign-in
      setSuccessMessage('Sign in successful. Redirecting to dashboard...')
      setErrorMessage(null)

      // Redirect to dashboard after successful login with a slightly longer delay
      // to ensure cookie is properly set
      setTimeout(() => {
        router.push('/dashboard')
        // Force a refresh to ensure the middleware sees the new cookie
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error('Client-side auth error:', error)

      // Handle different Firebase Auth error codes
      if (error instanceof Error) {
        // Firebase errors have a code property
        const firebaseError = error as { code?: string }
        const errorCode = firebaseError.code || ''

        if (errorCode === 'auth/wrong-password') {
          setErrorMessage('Incorrect password. Please try again.')
          form.setError('password', { message: 'Incorrect password' })
        } else if (errorCode === 'auth/user-not-found') {
          setErrorMessage(
            'No account found with this email. Please sign up first.'
          )
          form.setError('email', {
            message: 'No account found with this email',
          })
        } else if (errorCode === 'auth/too-many-requests') {
          setErrorMessage(
            'Too many failed login attempts. Please try again later or reset your password.'
          )
        } else {
          setErrorMessage('Failed to sign in. Please check your credentials.')
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    execute(values)
  }

  const handleSocialSignIn = async (
    provider: 'google' | 'facebook' | 'twitter'
  ) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      let authProvider

      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider()
          break
        case 'facebook':
          authProvider = new FacebookAuthProvider()
          break
        case 'twitter':
          authProvider = new TwitterAuthProvider()
          break
      }

      const result = await signInWithPopup(clientAuth, authProvider)

      if (result.user) {
        // Get the ID token
        const idToken = await result.user.getIdToken()

        // Set the session cookie via the API
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        })

        if (!response.ok) {
          throw new Error('Failed to create session')
        }

        // Successful social sign-in
        setSuccessMessage('Sign in successful. Redirecting to dashboard...')

        // Redirect to dashboard with a slightly longer delay
        // to ensure cookie is properly set
        setTimeout(() => {
          router.push('/dashboard')
          // Force a refresh to ensure the middleware sees the new cookie
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      setErrorMessage(
        `Failed to sign in with ${provider}. Please try another method.`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl w-full mx-auto">
      {successMessage && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
          {errorMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      disabled={status === 'executing' || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={status === 'executing' || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={status === 'executing' || isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('google')}
          disabled={status === 'executing' || isSubmitting}
          className="w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
            className="h-5 w-5 mr-2"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            />
          </svg>
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('facebook')}
          disabled={status === 'executing' || isSubmitting}
          className="w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 512"
            className="h-5 w-5 mr-2"
          >
            <path
              fill="currentColor"
              d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
            />
          </svg>
          Facebook
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialSignIn('twitter')}
          disabled={status === 'executing' || isSubmitting}
          className="w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="h-5 w-5 mr-2"
          >
            <path
              fill="currentColor"
              d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"
            />
          </svg>
          X
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-blue-600 hover:underline font-medium"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}
