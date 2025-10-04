'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Send, Smile, Paperclip, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

type Message = {
  id: string;
  content: string;
  timestamp: any;
  senderId: string;
  userName: string;
  userAvatar: string;
};

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const roomRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'rooms', roomId);
  }, [firestore, roomId]);
  const { data: room, isLoading: isLoadingRoom } = useDoc<{ name: string }>(roomRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!roomRef) return null;
    return query(collection(roomRef, 'messages'), orderBy('timestamp', 'asc'));
  }, [roomRef]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 100);
      }
    }
  }, [messages, isLoadingMessages]);

  const userRef = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const {data: currentUserData} = useDoc(userRef);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !roomRef || !currentUserData) return;

    const messagesCollection = collection(roomRef, 'messages');
    addDocumentNonBlocking(messagesCollection, {
      content: newMessage,
      timestamp: serverTimestamp(),
      senderId: user.uid,
      userName: currentUserData.name,
      userAvatar: currentUserData.avatarUrl,
    });

    setNewMessage('');
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (isLoadingRoom || isLoadingMessages) {
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
          {messages?.map((msg) => {
            const isCurrentUser = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-3 animate-in fade-in",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                    <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
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
                  {!isCurrentUser && <p className="text-xs font-bold mb-1 text-primary">{msg.userName}</p>}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className="text-xs mt-1.5 opacity-70 text-right">{formatTimestamp(msg.timestamp)}</p>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                    <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          {messages?.length === 0 && (
            <div className="text-center text-muted-foreground pt-10">No messages yet. Be the first to say something!</div>
          )}
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
            disabled={!user}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <Button type="button" size="icon" variant="ghost">
              <Smile className="h-5 w-5" />
            </Button>
            <Button type="button" size="icon" variant="ghost">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="submit" size="icon" variant="ghost" disabled={!newMessage.trim() || !user}>
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
    <div className="flex-1 p-4 md:p-6 space-y-6 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
    <footer className="border-t p-2 md:p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </footer>
  </div>
);
