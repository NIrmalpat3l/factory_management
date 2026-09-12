'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function authenticate(prevState: any, formData: FormData) {
  let isSuccess = false;

  try {
    const supabase = await createClient()

    const mode = formData.get('mode') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string



    if (!email || !password) {
      return { error: 'Email and password are required' }
    }

    if (mode === 'signup') {
      if (!fullName) {
        return { error: 'Full name is required for registration' }
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
        return { error: error.message }
      }
    } else {
      // login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }
    }


    return { success: true, error: null }
  } catch (err: any) {
    console.error('Server Action Exception:', err)
    return { error: 'An unexpected server error occurred: ' + (err.message || 'Unknown') }
  }
}
