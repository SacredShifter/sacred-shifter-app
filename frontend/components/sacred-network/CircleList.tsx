import { Plus, Users, Lock, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCircles } from '../../hooks/useCircles'
import CreateCircleModal from './CreateCircleModal'
import { useState } from 'react'

export default function CircleList() {
  const { myCircles, circles, joinCircle, leaveCircle } = useCircles()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">My Circles</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {myCircles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              You haven't joined any circles yet.
            </p>
          ) : (
            myCircles.map((circle) => (
              <div
                key={circle.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  {circle.is_public ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium text-sm">{circle.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {circle.member_count}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Discover Circles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {circles
            .filter(circle => !circle.is_member && circle.is_public)
            .slice(0, 5)
            .map((circle) => (
              <div key={circle.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{circle.name}</h4>
                    {circle.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {circle.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {circle.member_count}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600">
                        Public
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => joinCircle(circle.id)}
                    className="ml-2"
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <CreateCircleModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </div>
  )
}
