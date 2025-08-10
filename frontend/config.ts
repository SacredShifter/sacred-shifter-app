// Frontend configuration
// Set your Supabase project credentials here

// Your Supabase project URL (found in Project Settings > API)
export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-ref.supabase.co'

// Your Supabase anon/public key (found in Project Settings > API)
export const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Environment configuration
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// API configuration
export const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'

// Feature flags
export const features = {
  enableMessenger: true,
  enableSocialNetwork: true,
  enableAIAssistant: true,
  enableRealtime: true,
}

// Default user configuration (since no auth)
export const defaultUser = {
  id: 'default-user',
  email: 'seeker@sacred-shifter.app',
  username: 'sacred_seeker',
  display_name: 'Sacred Seeker',
  avatar_url: null,
}
