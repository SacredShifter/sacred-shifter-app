// Frontend configuration
// Set your Supabase project credentials here

// Your Supabase project URL (found in Project Settings > API)
export const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL || 'https://your-project-ref.supabase.co'

// Your Supabase anon/public key (found in Project Settings > API)
export const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Environment configuration
export const isDevelopment = import.meta.env.MODE === 'development'
export const isProduction = import.meta.env.MODE === 'production'

// API configuration
export const apiBaseUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:4000'

// Feature flags
export const features = {
  enableMessenger: true,
  enableSocialNetwork: true,
  enableAIAssistant: true,
  enableRealtime: true,
}

// Default user configuration (since no auth)
export const defaultUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'seeker@sacred-shifter.app',
  username: 'sacred_seeker',
  display_name: 'Sacred Seeker',
  avatar_url: null,
}

// AI Assistant Bot ID
export const AURA_BOT_ID = '00000000-0000-0000-0000-000000000001';