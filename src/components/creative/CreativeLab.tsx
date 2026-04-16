import React, { useState, useRef } from 'react';
import { 
  Wand2, 
  Send, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Loader2, 
  Paperclip,
  Lightbulb,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { analyzeIdea } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: { name: string; type: string; url: string }[];
  timestamp: Date;
}

export function CreativeLab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to the **Creative Lab**! 🚀\n\nI'm your AI creative partner. Feed me an idea, upload a mood board, or share a draft document. I'll help you refine it into a winning social media strategy.\n\nWhat's on your mind today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      files: selectedFiles.map(f => ({
        name: f.file.name,
        type: f.file.type,
        url: f.url
      })),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert files to base64 for Gemini
      const filePromises = selectedFiles.map(f => {
        return new Promise<{ data: string; mimeType: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              data: reader.result as string,
              mimeType: f.file.type
            });
          };
          reader.readAsDataURL(f.file);
        });
      });

      const processedFiles = await Promise.all(filePromises);
      setSelectedFiles([]); // Clear selected files after sending

      const aiResponse = await analyzeIdea(input, processedFiles);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in Creative Lab:", error);
    } finally {
      setIsLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Wand2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Creative Lab</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Idea Refinement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-4">
            <div className="flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-amber-500" />
              Ideation
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-indigo-500" />
              Strategy
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              Execution
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              message.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
              message.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {message.role === 'assistant' ? <Wand2 className="h-4 w-4" /> : <X className="h-4 w-4 rotate-45" />}
            </div>
            <div className="space-y-2">
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                message.role === 'assistant' 
                  ? "bg-muted/50 text-foreground border border-border" 
                  : "bg-primary text-primary-foreground"
              )}>
                <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                
                {message.files && message.files.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.files.map((file, i) => (
                      <div key={i} className="relative group">
                        {file.type.startsWith('image/') ? (
                          <img 
                            src={file.url} 
                            alt="Uploaded" 
                            className="w-24 h-24 object-cover rounded-lg border border-white/20"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-white/10 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-white/20">
                            <FileText className="h-8 w-8 mb-1" />
                            <span className="text-[8px] truncate w-full">{file.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground px-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 max-w-[85%]"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border text-sm italic text-muted-foreground">
              StratOS is analyzing your creative input...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border bg-muted/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Previews */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 pb-4"
              >
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    {file.file.type.startsWith('image/') ? (
                      <img 
                        src={file.url} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex flex-col items-center justify-center p-2 text-center border border-border">
                        <FileText className="h-8 w-8 text-muted-foreground mb-1" />
                        <span className="text-[8px] text-muted-foreground truncate w-full">{file.file.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your idea or ask for feedback..."
              className="w-full bg-muted/50 border border-border rounded-2xl p-4 pr-32 min-h-[100px] max-h-[300px] focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Send</span>
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground">
            StratOS Creative Lab uses Gemini AI to process images and documents.
          </p>
        </form>
      </div>
    </div>
  );
}
