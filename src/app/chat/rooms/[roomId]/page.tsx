'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { findRoomById, findUserById, currentUser, type Message } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [room, setRoom] = useState(findRoomById(roomId));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const foundRoom = findRoomById(roomId);
    setRoom(foundRoom);
    if (foundRoom) {
      setMessages(foundRoom.messages);
    }
    setTimeout(() => setIsLoading(false), 300);
  }, [roomId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
              viewport.scrollTop = viewport.scrollHeight;
            }, 0);
        }
    }
  }, [messages, isLoading]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const msg: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userId: currentUser.id,
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  if (isLoading) {
    return <ChatSkeleton />;
  }

  if (!room) {
    return <div className="text-center p-4">Room not found. Select a room to start.</div>;
  }

  return (
    <div className="flex h-full max-h-full flex-col">
      <header className="border-b p-4 flex items-center bg-background/95 backdrop-blur-sm z-10">
        <h2 className="font-headline text-xl font-semibold">{room.name}</h2>
      </header>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-6">
            {messages.map((msg) => {
              const user = findUserById(msg.userId);
              const isCurrentUser = msg.userId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-3 animate-in fade-in",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isCurrentUser && user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2.5 shadow-sm",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border"
                    )}
                  >
                    {!isCurrentUser && user && <p className="text-xs font-bold mb-1 text-primary">{user.name}</p>}
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className="text-xs mt-1.5 opacity-70 text-right">{msg.timestamp}</p>
                  </div>
                  {isCurrentUser && user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
        </div>
      </ScrollArea>
      <footer className="border-t p-2 md:p-4 bg-background/95 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="pr-28 bg-background"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <Button type="button" size="icon" variant="ghost">
              <Smile className="h-5 w-5" />
            </Button>
            <Button type="button" size="icon" variant="ghost">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="submit" size="icon" variant="ghost" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5 text-primary" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
}

const ChatSkeleton = () => (
    <div className="flex h-full flex-col">
      <header className="border-b p-4 flex items-center">
        <Skeleton className="h-6 w-32" />
      </header>
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-end gap-3 justify-start">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-16 w-64 rounded-lg" />
        </div>
        <div className="flex items-end gap-3 justify-end">
            <Skeleton className="h-12 w-48 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex items-end gap-3 justify-start">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-12 w-56 rounded-lg" />
        </div>
      </div>
      <footer className="border-t p-2 md:p-4">
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
        </div>
      </footer>
    </div>
)
