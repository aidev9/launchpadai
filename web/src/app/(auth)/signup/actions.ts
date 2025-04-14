'use server'

import { adminAuth } from '@/lib/firebase/admin'
import { adminDb } from '@/lib/firebase/admin'
import { z } from 'zod'
import { actionClient } from '@/lib/action'
import { returnValidationErrors } from 'next-safe-action'

// Schema for signup data validation
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  // Optional fields from WaitlistForm
  company: z.string().optional(),
  role: z.string().optional(),
  interest: z.string().optional(),
  phone: z.string().optional(),
})

export type SignupFormData = z.infer<typeof signupSchema>

export const signupAction = actionClient
  .schema(signupSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Create a new user with Firebase Admin SDK
      const userRecord = await adminAuth.createUser({
        email: parsedInput.email,
        password: parsedInput.password,
        displayName: parsedInput.name,
      })

      // Set custom claims or user properties if needed
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: 'user',
      })

      // Store the user data in Firestore with userId as document ID
      await adminDb
        .collection('users')
        .doc(userRecord.uid)
        .set({
          name: parsedInput.name,
          email: parsedInput.email,
          company: parsedInput.company || '',
          role: parsedInput.role || '',
          interest: parsedInput.interest || '',
          phone: parsedInput.phone || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      return {
        success: true,
        message:
          'Your account has been created successfully. Signing you in...',
        userId: userRecord.uid,
      }
    } catch (error) {
      console.error('Error creating user:', error)

      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        if (error.message.includes('email-already-exists')) {
          return returnValidationErrors(signupSchema, {
            email: {
              _errors: [
                'This email is already registered. Please login or use a different email.',
              ],
            },
          })
        }

        if (error.message.includes('invalid-email')) {
          return returnValidationErrors(signupSchema, {
            email: { _errors: ['The email address is not valid.'] },
          })
        }

        if (error.message.includes('weak-password')) {
          return returnValidationErrors(signupSchema, {
            password: {
              _errors: [
                'The password is too weak. Please choose a stronger password.',
              ],
            },
          })
        }
      }

      return {
        success: false,
        message: 'An error occurred during signup. Please try again later.',
      }
    }
  })
