
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MessageSquare, Plus, Users, Menu, Loader2, Trash2 } from "lucide-react";
import * as React from "react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenuSkeleton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, doc, getDocs, writeBatch } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Room } from "@/lib/data";

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
});

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isCreateRoomOpen, setCreateRoomOpen] = React.useState(false);
  const [deleteRoom, setDeleteRoom] = React.useState<WithId<Room> | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  type RoomWithId = Room & { id: string };

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "rooms"), orderBy("name"));
  }, [firestore]);

  const { data: rooms, isLoading: isLoadingRooms } = useCollection<RoomWithId>(roomsQuery);

  const handleLogout = async () => {
    if(!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const form = useForm<z.infer<typeof createRoomSchema>>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleCreateRoom = (values: z.infer<typeof createRoomSchema>) => {
    if (!user || !firestore) return;
    const roomsCollection = collection(firestore, "rooms");
    addDocumentNonBlocking(roomsCollection, {
      name: values.name,
      creatorId: user.uid,
    });
    toast({ title: "Room created!" });
    setCreateRoomOpen(false);
    form.reset();
  };
  
  const handleDeleteRoom = async () => {
    if (!firestore || !deleteRoom || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const roomRef = doc(firestore, 'rooms', deleteRoom.id);
      const messagesRef = collection(roomRef, 'messages');
      
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(firestore);
      messagesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      deleteDocumentNonBlocking(roomRef);

      toast({ title: "Room deleted", description: `Room "${deleteRoom.name}" and all its messages have been deleted.` });

      if (pathname.includes(deleteRoom.id)) {
        router.push('/chat');
      }

    } catch (error) {
      console.error("Error deleting room:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete room." });
    } finally {
      setIsDeleting(false);
      setDeleteRoom(null);
    }
  };


  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isChatPage = pathname.startsWith('/chat');

  return (
    <SidebarProvider>
      <div className="bg-background flex flex-col h-screen">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-primary" />
                <h1 className="font-headline text-2xl font-semibold">Chatify</h1>
                <SidebarTrigger className="ml-auto" />
              </div>
            </SidebarHeader>
            <SidebarContent>
                <>
                  <Separator className="my-2" />
                  <SidebarGroup>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setCreateRoomOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Room
                    </Button>
                  </SidebarGroup>
                  <Separator className="my-2" />
                  <SidebarMenu>
                    {isLoadingRooms ? (
                      <>
                        <SidebarMenuSkeleton showIcon />
                        <SidebarMenuSkeleton showIcon />
                        <SidebarMenuSkeleton showIcon />
                      </>
                    ) : (
                      rooms?.map((room) => (
                        <SidebarMenuItem key={room.id}>
                          <Link href={`/chat/rooms/${room.id}`} passHref className="flex-1">
                            <SidebarMenuButton
                              isActive={pathname === `/chat/rooms/${room.id}`}
                              tooltip={{ children: room.name, side: 'right' }}
                              className="justify-start"
                            >
                              <Users />
                              <span>{room.name}</span>
                            </SidebarMenuButton>
                          </Link>
                          {user?.uid === room.creatorId && (
                             <SidebarMenuAction
                               onClick={() => setDeleteRoom(room)}
                               aria-label="Delete room"
                               showOnHover
                             >
                               <Trash2 />
                             </SidebarMenuAction>
                          )}
                        </SidebarMenuItem>
                      ))
                    )}
                  </SidebarMenu>
                </>
            </SidebarContent>
            <SidebarFooter>
              <Separator className="my-2" />
              {user && (
                <div className="flex items-center justify-between w-full p-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName || user.email || ''} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-sm">{user.displayName || user.email}</span>
                      <span className="text-xs text-muted-foreground">Free Plan</span>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Log out</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </SidebarFooter>
          </Sidebar>
          <div className="flex flex-col flex-1 w-full h-full">
            <header className="p-4 border-b flex items-center justify-between md:hidden">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="font-headline text-xl font-semibold">Chatify</h2>
              </div>
              <SidebarTrigger>
                <Menu />
              </SidebarTrigger>
            </header>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Dialog open={isCreateRoomOpen} onOpenChange={setCreateRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new room</DialogTitle>
            <DialogDescription>Enter a name for your new chat room.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateRoom)} className="space-y-4">
            <Input {...form.register("name")} placeholder="e.g., Cool Project" />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateRoomOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteRoom} onOpenChange={(open) => !open && setDeleteRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room "{deleteRoom?.name}" and all of its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRoom(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

// Helper type for useCollection
type WithId<T> = T & { id: string };

    
    