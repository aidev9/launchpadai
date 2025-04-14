'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { sendPasswordResetEmail } from 'firebase/auth'
import { clientAuth } from '@/lib/firebase/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAction } from 'next-safe-action/hooks'
import { forgotPasswordAction } from './actions'
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
})

type FormData = z.infer<typeof formSchema>

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  // Use next-safe-action hook
  const { execute, status, result } = useAction(forgotPasswordAction, {
    onSuccess: (data) => {
      if (data.data?.success) {
        // The server-side validation has passed, now try client-side password reset
        handlePasswordReset(form.getValues())
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
          // Cast field to keyof FormData
          form.setError(field as keyof FormData, {
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

  const handlePasswordReset = async (values: FormData) => {
    setIsSubmitting(true)
    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(clientAuth, values.email)

      // Show success message
      setSuccessMessage(
        'Password reset email sent! Check your inbox for instructions.'
      )

      // Clear form
      form.reset()
    } catch (error) {
      console.error('Password reset error:', error)

      // Handle different Firebase Auth error codes
      if (error instanceof Error) {
        // Firebase errors have a code property
        const firebaseError = error as { code?: string }
        const errorCode = firebaseError.code || ''

        if (errorCode === 'auth/user-not-found') {
          setErrorMessage(
            'No account found with this email. Please check your email or sign up.'
          )
        } else if (errorCode === 'auth/invalid-email') {
          setErrorMessage('The email address is not valid.')
        } else if (errorCode === 'auth/too-many-requests') {
          setErrorMessage('Too many requests. Please try again later.')
        } else {
          setErrorMessage('Failed to send reset email. Please try again.')
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = (values: FormData) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    execute(values)
  }

  return (
    <div className="space-y-6 w-full">
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

          <Button
            type="submit"
            className="w-full"
            disabled={status === 'executing' || isSubmitting}
          >
            {isSubmitting ? 'Sending reset link...' : 'Reset Password'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-gray-600">
        Remembered your password?{' '}
        <Link
          href="/signin"
          className="text-blue-600 hover:underline font-medium"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
