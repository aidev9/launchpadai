'use server'

import { adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'
import { actionClient } from '@/lib/action'
import { returnValidationErrors } from 'next-safe-action'

// Schema for signin data validation
const signinSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type SigninFormData = z.infer<typeof signinSchema>

export const signinAction = actionClient
  .schema(signinSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Find the user by email
      const userRecord = await adminAuth.getUserByEmail(parsedInput.email)

      // Check if the user exists and uses email/password auth
      const emailAuthMethod = userRecord.providerData.find(
        (provider) => provider.providerId === 'password'
      )

      if (!emailAuthMethod) {
        return returnValidationErrors(signinSchema, {
          email: {
            _errors: [
              'This email uses a different sign-in method. Please use the appropriate social sign-in button.',
            ],
          },
        })
      }

      // We can't verify the password on the server side with Firebase Admin SDK
      // The validation happens on the client side when calling signInWithEmailAndPassword
      // We're just checking if the user exists here

      return {
        success: true,
        message: 'User exists, proceed with client-side authentication',
        userId: userRecord.uid,
      }
    } catch (error) {
      console.error('Error authenticating user:', error)

      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          return returnValidationErrors(signinSchema, {
            email: {
              _errors: [
                'No account found with this email. Please check your email or sign up.',
              ],
            },
          })
        }

        if (error.message.includes('invalid-email')) {
          return returnValidationErrors(signinSchema, {
            email: { _errors: ['The email address is not valid.'] },
          })
        }
      }

      return {
        success: false,
        message: 'Authentication failed. Please check your credentials.',
      }
    }
  })
