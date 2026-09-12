'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = {
  success: boolean;
  error: string | null;
};

export async function authenticate(prevState: AuthState, formData: FormData): Promise<AuthState> {
  let isSuccess = false;

  try {
    const supabase = await createClient()

    const mode = formData.get('mode') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string



    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    if (mode === 'signup') {
      if (!fullName) {
        return { success: false, error: 'Full name is required for registration' }
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })
      
      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }
    }


    return { success: true, error: null }
  } catch (err: any) {
    console.error('Server Action Exception:', err)
    return { success: false, error: 'An unexpected server error occurred: ' + (err.message || 'Unknown') }
  }
}
