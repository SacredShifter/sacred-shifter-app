import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface VigilPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (vigil: { code: string; url: string }) => void
}

// Mock vigil data - in production this would come from your vigil system
const mockVigils = [
  { code: 'SOL-528', name: 'Solar Harmony', url: '/vigils/sol-528.png' },
  { code: 'LUN-432', name: 'Lunar Resonance', url: '/vigils/lun-432.png' },
  { code: 'AUR-741', name: 'Aurora Frequency', url: '/vigils/aur-741.png' },
  { code: 'COS-963', name: 'Cosmic Unity', url: '/vigils/cos-963.png' },
  { code: 'TER-396', name: 'Earth Grounding', url: '/vigils/ter-396.png' },
  { code: 'AET-852', name: 'Aether Bridge', url: '/vigils/aet-852.png' },
]

export default function VigilPicker({ open, onOpenChange, onSelect }: VigilPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sparkles className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Sacred Vigils
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-3">
          {mockVigils.map((vigil) => (
            <button
              key={vigil.code}
              onClick={() => onSelect(vigil)}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-medium text-gray-900">{vigil.code}</p>
              <p className="text-xs text-gray-500 text-center">{vigil.name}</p>
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Select a sacred vigil to share its resonance
        </p>
      </DialogContent>
    </Dialog>
  )
}
