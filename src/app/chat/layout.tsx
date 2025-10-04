"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MessageSquare, Plus, Users, Menu, Loader2 } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, where, doc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

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

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "rooms"), orderBy("name"));
  }, [firestore]);

  const { data: rooms, isLoading: isLoadingRooms } = useCollection<{ name: string }>(roomsQuery);

  const userRef = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const {data: currentUser, isLoading: isLoadingCurrentUserData} = useDoc<{name: string, avatarUrl: string}>(userRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const form = useForm<z.infer<typeof createRoomSchema>>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleCreateRoom = async (values: z.infer<typeof createRoomSchema>) => {
    if (!user) return;
    const roomsCollection = collection(firestore, "rooms");
    try {
      await addDocumentNonBlocking(roomsCollection, {
        name: values.name,
        creatorId: user.uid,
      });
      toast({ title: "Room created!" });
      setCreateRoomOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to create room", description: error.message });
    }
  };

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || isLoadingCurrentUserData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                      <Link href={`/chat/rooms/${room.id}`} passHref>
                        <SidebarMenuButton
                          isActive={pathname === `/chat/rooms/${room.id}`}
                          tooltip={{ children: room.name, side: 'right' }}
                          className="justify-start"
                        >
                          <Users />
                          <span>{room.name}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <Separator className="my-2" />
              {currentUser && (
                <div className="flex items-center justify-between w-full p-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                      <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-sm">{currentUser.name}</span>
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
    </SidebarProvider>
  );
}
