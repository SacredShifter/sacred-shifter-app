import React, { useState, useRef } from 'react';
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

const AIAssistant = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
          setSelectedFile(event.target.files[0]);
      }
  };

  const handleFileUpload = async () => {
      if (!selectedFile) return;
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
          const response = await fetch('/api/ai/analyzeFile', {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              throw new Error('File upload failed');
          }
          
          const result = await response.json();
          console.log('File analysis result:', result);
          // Process result data as needed
      } catch (error) {
          console.error('Error uploading file:', error);
      } finally {
          setSelectedFile(null);
      }
  };

  return (
    <div>
      <input type="file" ref={inputFileRef} onChange={handleFileChange} />
      {selectedFile && <p>File Selected: {selectedFile.name}</p>}
      <button onClick={handleFileUpload}>Upload for Analysis</button>
    </div>
  );
};

export default AIAssistant;