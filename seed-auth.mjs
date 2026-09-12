import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim()

const supabase = createClient(url, key)

const usersToSeed = [
  { email: 'nspatel3030@gmail.com', name: 'Admin QA', role: 'admin' },
  { email: 'nspp3305@gmail.com', name: 'Worker QA', role: 'worker' },
  { email: 'nmlpatel300305@gmail.com', name: 'Viewer QA', role: 'viewer' }
]

async function seed() {
  console.log('Starting seed process...')
  
  // Assuming you manually deleted the corrupted users via SQL Editor
  for (const seedUser of usersToSeed) {
    console.log(`Creating user: ${seedUser.email}`)

    const { data, error } = await supabase.auth.admin.createUser({
      email: seedUser.email,
      password: '123456',
      email_confirm: true,
      user_metadata: { full_name: seedUser.name }
    })

    if (error) {
      console.error(`Failed to create ${seedUser.email}:`, error)
      continue
    }

    // Now insert into public.profiles
    console.log(`Creating profile for: ${seedUser.email}`)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: seedUser.name,
        role: seedUser.role,
        is_active: true
      })

    if (profileError) {
      console.error(`Failed to create profile for ${seedUser.email}:`, profileError)
    }
  }

  console.log('Seed process completed successfully!')
  process.exit(0)
}

seed()
