import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, Database, Key, Table } from 'lucide-react'
import { testSupabaseConnection, testSupabaseAuth, testSupabaseTables } from '../lib/supabase-test'

export default function SupabaseConnectionTest() {
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [authResult, setAuthResult] = useState<any>(null)
  const [tablesResult, setTablesResult] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runAllTests = async () => {
    setTesting(true)
    
    try {
      console.log('Running Supabase connection tests...')
      
      // Test basic connection
      const connResult = await testSupabaseConnection()
      setConnectionResult(connResult)
      
      // Test auth
      const authRes = await testSupabaseAuth()
      setAuthResult(authRes)
      
      // Test tables
      const tablesRes = await testSupabaseTables()
      setTablesResult(tablesRes)
      
    } catch (error) {
      console.error('Test suite failed:', error)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Success" : "Failed"}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Supabase Connection Test</h1>
        <p className="text-gray-600">Test your Supabase configuration and database connectivity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Configuration Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Supabase URL</span>
            <div className="flex items-center space-x-2">
              {process.env.REACT_APP_SUPABASE_URL && 
               !process.env.REACT_APP_SUPABASE_URL.includes('your-project-ref') ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge variant="default">Configured</Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <Badge variant="destructive">Not Set</Badge>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Supabase Anon Key</span>
            <div className="flex items-center space-x-2">
              {process.env.REACT_APP_SUPABASE_ANON_KEY && 
               !process.env.REACT_APP_SUPABASE_ANON_KEY.includes('your-anon-key') ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge variant="default">Configured</Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <Badge variant="destructive">Not Set</Badge>
                </>
              )}
            </div>
          </div>

          {(!process.env.REACT_APP_SUPABASE_URL?.includes('supabase.co') || 
            !process.env.REACT_APP_SUPABASE_ANON_KEY?.startsWith('eyJ')) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuration Required:</strong>
                <br />
                1. Copy <code>.env.example</code> to <code>.env.local</code>
                <br />
                2. Set your Supabase URL and anon key in <code>.env.local</code>
                <br />
                3. Restart your development server
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={runAllTests} 
          disabled={testing}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {testing ? 'Testing...' : 'Run Connection Tests'}
        </Button>
      </div>

      {/* Connection Test Results */}
      {connectionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Database Connection
              </div>
              {getStatusBadge(connectionResult.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionResult.success ? (
              <div className="text-green-700">
                <p>✅ Successfully connected to Supabase</p>
                <p className="text-sm text-gray-600 mt-1">
                  Posts table accessible
                </p>
              </div>
            ) : (
              <div className="text-red-700">
                <p>❌ Connection failed</p>
                <p className="text-sm mt-1">Error: {connectionResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auth Test Results */}
      {authResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Authentication
              </div>
              {getStatusBadge(authResult.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authResult.success ? (
              <div className="text-green-700">
                <p>✅ Auth system accessible</p>
                <p className="text-sm text-gray-600 mt-1">
                  {authResult.message}
                </p>
              </div>
            ) : (
              <div className="text-red-700">
                <p>❌ Auth test failed</p>
                <p className="text-sm mt-1">Error: {authResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tables Test Results */}
      {tablesResult.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Table className="w-5 h-5 mr-2" />
              Database Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tablesResult.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-mono text-sm">{result.table}</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.success)}
                    {result.success && (
                      <span className="text-xs text-gray-500">
                        {result.count !== undefined ? `${result.count} rows` : 'accessible'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>
                ✅ {tablesResult.filter(r => r.success).length} / {tablesResult.length} tables accessible
              </p>
              {tablesResult.some(r => !r.success) && (
                <div className="mt-2 text-red-600">
                  <p>Failed tables:</p>
                  <ul className="list-disc list-inside">
                    {tablesResult
                      .filter(r => !r.success)
                      .map((result, index) => (
                        <li key={index}>
                          <code>{result.table}</code>: {result.error}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Get your Supabase credentials:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to Settings → API</li>
              <li>Copy your Project URL and anon/public key</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Configure environment variables:</h4>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
              <p>REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co</p>
              <p>REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Restart your development server</h4>
            <p className="text-sm text-gray-600">
              After setting the environment variables, restart your dev server for changes to take effect.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
