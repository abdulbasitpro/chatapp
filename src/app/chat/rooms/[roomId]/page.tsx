'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, Smile, Paperclip, Loader2, Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { MessageContent } from './message-content';
import { Progress } from '@/components/ui/progress';

type Message = {
  id: string;
  content: string;
  timestamp: any;
  senderId: string;
  userName: string;
  userAvatar: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
};

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  const [newMessage, setNewMessage] = useState('');
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'rooms', roomId);
  }, [firestore, roomId]);
  const { data: room, isLoading: isLoadingRoom, error: roomError } = useDoc<{ name: string }>(roomRef);

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
  
  useEffect(() => {
    // Redirect only if loading is complete and the room does not exist (either error or null data).
    if (!isLoadingRoom && (!room || roomError)) {
      toast({
        variant: "destructive",
        title: "Error loading room",
        description: "The room may not exist or you don't have permission to view it.",
      });
      router.replace('/chat');
    }
  }, [room, isLoadingRoom, roomError, router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === '' && !uploadingFile) || !user || !roomRef) return;

    if (uploadingFile) {
      handleFileUpload(uploadingFile);
    } else {
      sendMessage(newMessage);
    }
  
    setNewMessage('');
    setUploadingFile(null);
    setEmojiPickerOpen(false);
  };
  
  const sendMessage = (content: string, fileData?: { fileUrl: string, fileName: string, fileType: string }) => {
    if(!user || !roomRef) return;
    const messagesCollection = collection(roomRef, 'messages');
    addDocumentNonBlocking(messagesCollection, {
      content: content,
      timestamp: serverTimestamp(),
      senderId: user.uid,
      userName: user.displayName,
      userAvatar: `https://i.pravatar.cc/150?u=${user.uid}`,
      ...fileData,
    });
  }

  const handleFileUpload = (file: File) => {
    if (!file || !user || !roomId) return;
    
    setUploadProgress(0);
    const filePath = `chat_files/${roomId}/${Date.now()}_${file.name}`;
    const fileStorageRef = storageRef(storage, filePath);
    const uploadTask = uploadBytesResumable(fileStorageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload failed:", error);
        toast({ variant: "destructive", title: "Upload failed", description: "Could not upload your file." });
        setUploadingFile(null);
        setUploadProgress(0);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          sendMessage(newMessage, {
            fileUrl: downloadURL,
            fileName: file.name,
            fileType: file.type,
          });
          setUploadingFile(null);
          setUploadProgress(0);
          setNewMessage('');
        });
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setNewMessage(file.name); 
    }
  };
  
  const cancelUpload = () => {
    setUploadingFile(null);
    setNewMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  const handleDeleteMessage = async () => {
    if (!firestore || !messageToDelete || !roomRef || isDeleting) return;
    
    setIsDeleting(true);

    try {
      const messageRef = doc(roomRef, 'messages', messageToDelete.id);
      deleteDocumentNonBlocking(messageRef);
      toast({ title: "Message deleted" });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete message." });
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (isLoadingRoom || !room) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex h-full max-h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
        <h2 className="font-bold text-xl text-slate-800 dark:text-slate-200">{room?.name}</h2>
      </header>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-6">
          {isLoadingMessages ? (
             <div className="flex items-center justify-center pt-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : messages?.map((msg) => {
            const isCurrentUser = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                className={cn(
                  "group flex items-end gap-2 animate-in fade-in max-w-lg",
                  isCurrentUser ? "justify-end ml-auto" : "justify-start"
                )}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                    <AvatarFallback>{msg.userName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 shadow-sm relative",
                    isCurrentUser
                      ? "bg-blue-600 text-white rounded-br-lg"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-lg"
                  )}
                >
                  {!isCurrentUser && <p className="text-xs font-bold mb-1 text-blue-500">{msg.userName}</p>}
                  <MessageContent message={msg} />
                  <p className={cn("text-xs mt-1.5 opacity-70 text-right", isCurrentUser ? "text-blue-200" : "text-slate-400")}>{formatTimestamp(msg.timestamp)}</p>
                   {isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -left-8 top-1/2 -translate-y-1/2"
                      onClick={() => setMessageToDelete(msg)}
                      aria-label="Delete message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
          {!isLoadingMessages && messages?.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 pt-10">No messages yet. Be the first to say something!</div>
          )}
        </div>
      </ScrollArea>
       <footer className="border-t border-slate-200 dark:border-slate-800 p-2 md:p-4 bg-white dark:bg-slate-950">
        {(uploadingFile && uploadProgress > 0) && (
          <div className="px-2 pb-2">
            <Progress value={uploadProgress} className="w-full h-1" />
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">Uploading {uploadingFile.name}... ({Math.round(uploadProgress)}%)</p>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder={uploadingFile ? uploadingFile.name : "Type a message..."}
            autoComplete="off"
            className="pr-28 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/50"
            disabled={!user || (uploadingFile && uploadProgress > 0 && uploadProgress < 100)}
            readOnly={!!uploadingFile}
          />
           <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
             {uploadingFile && (
                <Button type="button" size="icon" variant="ghost" onClick={cancelUpload}>
                  <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </Button>
            )}
            <Popover open={isEmojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" size="icon" variant="ghost" disabled={!!uploadingFile}>
                  <Smile className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0 mb-2">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                />
              </PopoverContent>
            </Popover>
            <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={!!uploadingFile}>
              <Paperclip className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </Button>
            <Button type="submit" size="icon" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={(!newMessage.trim() && !uploadingFile) || !user || (uploadingFile && uploadProgress > 0 && uploadProgress < 100)}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </footer>
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMessageToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const ChatSkeleton = () => (
  <div className="flex h-full flex-col">
    <header className="border-b p-4 flex items-center">
      <Skeleton className="h-6 w-32" />
    </header>
    <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
    <footer className="border-t p-2 md:p-4">
      <Skeleton className="relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
    </footer>
  </div>
);

    