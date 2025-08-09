import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Bot, User, X, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { AIMessage, AIConversation } from '~backend/ai/assistant';

interface AIAssistantProps {
  contextType?: string;
  contextData?: Record<string, any>;
  className?: string;
}

export default function AIAssistant({ contextType = 'general', contextData = {}, className = '' }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => backend.ai.listConversations(),
    enabled: isOpen,
  });

  const { data: currentConversation } = useQuery({
    queryKey: ['ai-conversation', currentConversationId],
    queryFn: () => currentConversationId ? backend.ai.getConversation({ id: currentConversationId }) : null,
    enabled: !!currentConversationId,
  });

  const { data: preferences } = useQuery({
    queryKey: ['ai-preferences'],
    queryFn: () => backend.ai.getPreferences(),
    enabled: isOpen,
  });

  const chatMutation = useMutation({
    mutationFn: (data: { message: string; conversation_id?: string; context_type?: string; context_data?: Record<string, any> }) =>
      backend.ai.chat(data),
    onSuccess: (response) => {
      setCurrentConversationId(response.conversation.id);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', response.conversation.id] });
      setMessage('');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => backend.ai.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-preferences'] });
      toast({
        title: "Success",
        description: "AI assistant preferences updated.",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    chatMutation.mutate({
      message,
      conversation_id: currentConversationId || undefined,
      context_type: contextType,
      context_data: contextData,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getContextBadgeColor = (type: string) => {
    switch (type) {
      case 'journal': return 'bg-green-100 text-green-800';
      case 'meditation': return 'bg-purple-100 text-purple-800';
      case 'echo_glyphs': return 'bg-indigo-100 text-indigo-800';
      case 'community': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 left-4 z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 ${className}`}
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 left-4 z-50 w-96 shadow-xl border-purple-200 ${isMinimized ? 'h-16' : 'h-[600px]'} ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center">
          <Bot className="w-5 h-5 mr-2 text-purple-600" />
          Aether AI Assistant
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Badge className={getContextBadgeColor(contextType)}>
            {contextType.replace('_', ' ')}
          </Badge>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Assistant Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="personality">Assistant Personality</Label>
                  <Select
                    value={preferences?.assistant_personality || 'wise_guide'}
                    onValueChange={(value) => updatePreferencesMutation.mutate({ assistant_personality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wise_guide">Wise Guide</SelectItem>
                      <SelectItem value="supportive_friend">Supportive Friend</SelectItem>
                      <SelectItem value="analytical_mentor">Analytical Mentor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="response_style">Response Style</Label>
                  <Select
                    value={preferences?.preferred_response_style || 'balanced'}
                    onValueChange={(value) => updatePreferencesMutation.mutate({ preferred_response_style: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dream_analysis">Dream Analysis</Label>
                    <Switch
                      id="dream_analysis"
                      checked={preferences?.dream_analysis_enabled ?? true}
                      onCheckedChange={(checked) => updatePreferencesMutation.mutate({ dream_analysis_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="journal_assistance">Journal Assistance</Label>
                    <Switch
                      id="journal_assistance"
                      checked={preferences?.journal_assistance_enabled ?? true}
                      onCheckedChange={(checked) => updatePreferencesMutation.mutate({ journal_assistance_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="meditation_guidance">Meditation Guidance</Label>
                    <Switch
                      id="meditation_guidance"
                      checked={preferences?.meditation_guidance_enabled ?? true}
                      onCheckedChange={(checked) => updatePreferencesMutation.mutate({ meditation_guidance_enabled: checked })}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-[520px] p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {!currentConversation?.messages?.length && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Hello! I'm Aether</h3>
                  <p className="text-sm text-gray-600">
                    I'm your AI assistant and keeper of Sacred Shifter. How can I help you on your spiritual journey today?
                  </p>
                </div>
              )}

              {currentConversation?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 mr-2" />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-xs opacity-75">
                        {msg.role === 'user' ? 'You' : 'Aether'}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center">
                      <Bot className="w-4 h-4 mr-2" />
                      <span className="text-xs text-gray-600">Aether is thinking...</span>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Aether anything..."
                disabled={chatMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || chatMutation.isPending}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
