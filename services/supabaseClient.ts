import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Avoid crashing the entire app if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL WARNING: Missing Supabase environment variables. App will not function correctly.')
}

// Use placeholders to prevent createClient from throwing immediately, allowing the UI to render an error message later
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
