'use server'

import { adminAuth } from '@/lib/firebase/admin'
import { z } from 'zod'
import { actionClient } from '@/lib/action'
import { returnValidationErrors } from 'next-safe-action'

// Schema for forgot password validation
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export const forgotPasswordAction = actionClient
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Check if the user exists
      const userRecord = await adminAuth.getUserByEmail(parsedInput.email)

      // Check if the user uses email/password auth
      const emailAuthMethod = userRecord.providerData.find(
        (provider) => provider.providerId === 'password'
      )

      if (!emailAuthMethod) {
        return returnValidationErrors(forgotPasswordSchema, {
          email: {
            _errors: [
              'This email uses a different sign-in method. Please use the appropriate social sign-in button.',
            ],
          },
        })
      }

      return {
        success: true,
        message: 'User exists, proceed with client-side password reset',
      }
    } catch (error) {
      console.error('Error finding user:', error)

      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          return returnValidationErrors(forgotPasswordSchema, {
            email: {
              _errors: [
                'No account found with this email. Please check your email or sign up.',
              ],
            },
          })
        }

        if (error.message.includes('invalid-email')) {
          return returnValidationErrors(forgotPasswordSchema, {
            email: { _errors: ['The email address is not valid.'] },
          })
        }
      }

      return {
        success: false,
        message: 'An error occurred. Please try again later.',
      }
    }
  })
