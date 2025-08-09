import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Eye, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';
import AIAssistant from '../components/AIAssistant';
import type { EchoGlyph } from '~backend/echo_glyphs/list';

export default function EchoGlyphsPage() {
  const [selectedGlyph, setSelectedGlyph] = useState<EchoGlyph | null>(null);

  const { data: echoGlyphs, isLoading } = useQuery({
    queryKey: ['echo-glyphs'],
    queryFn: () => backend.echo_glyphs.list(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const echoGlyphsContextData = {
    total_glyphs: echoGlyphs?.glyphs.length || 0,
    resonance_types: [...new Set(echoGlyphs?.glyphs.map(g => g.resonance_type) || [])],
    selected_glyph: selectedGlyph ? {
      name: selectedGlyph.name,
      resonance_type: selectedGlyph.resonance_type,
      linked_nodes: selectedGlyph.linked_nodes,
      notes: selectedGlyph.notes
    } : null,
    recent_glyphs: echoGlyphs?.glyphs.slice(0, 3).map(glyph => ({
      name: glyph.name,
      resonance_type: glyph.resonance_type,
      timestamp: glyph.timestamp
    })) || []
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Echo Glyph Resonance Map
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore the interconnected patterns of consciousness and discover the sacred geometries that guide our collective evolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {echoGlyphs?.glyphs.map((glyph) => (
          <Card key={glyph.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-200 hover:border-purple-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{glyph.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGlyph(glyph)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="capitalize">
                {glyph.resonance_type} resonance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {glyph.glyph_image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={glyph.glyph_image_url}
                    alt={glyph.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Linked Nodes:</p>
                  <div className="flex flex-wrap gap-1">
                    {glyph.linked_nodes.slice(0, 3).map((node, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {node.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {glyph.linked_nodes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{glyph.linked_nodes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {glyph.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">{glyph.notes}</p>
                )}

                <p className="text-xs text-gray-500">
                  Discovered: {new Date(glyph.timestamp).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedGlyph} onOpenChange={() => setSelectedGlyph(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                {selectedGlyph?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGlyph(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedGlyph && (
            <div className="space-y-6">
              {selectedGlyph.glyph_image_url && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedGlyph.glyph_image_url}
                    alt={selectedGlyph.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Resonance Type</h4>
                  <Badge variant="secondary" className="capitalize">
                    {selectedGlyph.resonance_type}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Discovery Date</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedGlyph.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Linked Nodes</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGlyph.linked_nodes.map((node, index) => (
                    <Badge key={index} variant="outline">
                      {node.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedGlyph.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedGlyph.notes}
                  </p>
                </div>
              )}

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Glyph ID</h4>
                <p className="text-sm text-purple-700 font-mono">{selectedGlyph.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIAssistant 
        contextType="echo_glyphs" 
        contextData={echoGlyphsContextData}
        className="bottom-4 left-4"
      />
    </div>
  );
}
