import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useCircles } from '../../hooks/useCircles'

interface CreateCircleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateCircleModal({ open, onOpenChange }: CreateCircleModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createCircle } = useCircles()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a circle name.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await createCircle({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic
      })
      
      // Reset form
      setName('')
      setDescription('')
      setIsPublic(false)
      onOpenChange(false)
      
      toast({
        title: "Success",
        description: "Your circle has been created!",
      })
    } catch (error) {
      console.error('Failed to create circle:', error)
      toast({
        title: "Error",
        description: "Failed to create circle. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Circle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Circle Name</Label>
            <Input
              id="name"
              placeholder="Enter circle name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your circle's purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Make this circle public</Label>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Circle'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
