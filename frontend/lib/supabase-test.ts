import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL || 'Not set')
    console.log('Supabase Anon Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase connection error:', error)
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
    
    console.log('Supabase connection successful!')
    console.log('Posts table accessible, count:', data)
    
    return {
      success: true,
      message: 'Connection successful',
      count: data
    }
  } catch (error) {
    console.error('Supabase test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

export async function testSupabaseAuth() {
  try {
    console.log('Testing Supabase auth...')
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
    
    console.log('Auth check successful, user:', user)
    
    return {
      success: true,
      user,
      message: user ? 'User authenticated' : 'No user authenticated (expected for anon access)'
    }
  } catch (error) {
    console.error('Auth test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

export async function testSupabaseTables() {
  const tables = [
    'posts',
    'circles', 
    'circle_members',
    'post_reactions',
    'comments',
    'threads',
    'thread_members',
    'messages',
    'notifications'
  ]
  
  const results = []
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        results.push({
          table,
          success: false,
          error: error.message
        })
      } else {
        results.push({
          table,
          success: true,
          count: data
        })
      }
    } catch (error) {
      results.push({
        table,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return results
}
