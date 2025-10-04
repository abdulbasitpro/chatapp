"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MessageCircle, Plus, Users } from "lucide-react";
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
  SidebarInset,
  SidebarGroup,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currentUser, rooms } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <SidebarProvider>
      <div className="bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-primary" />
              <h1 className="font-headline text-xl font-semibold">Chatapp</h1>
              <SidebarTrigger className="ml-auto" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Room
                </Button>
            </SidebarGroup>
            <Separator className="my-2" />
            <SidebarMenu>
              {rooms.map((room) => (
                <SidebarMenuItem key={room.id}>
                  <Link href={`/chat/rooms/${room.id}`} passHref>
                    <SidebarMenuButton
                      isActive={pathname === `/chat/rooms/${room.id}`}
                      tooltip={{children: room.name, side: 'right'}}
                    >
                      <Users />
                      <span>{room.name}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center justify-between w-full p-2">
              <div className="flex items-center gap-2 overflow-hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">{currentUser.name}</span>
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
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="p-4 border-b flex items-center md:hidden">
                <SidebarTrigger />
                <h2 className="font-headline text-xl font-semibold ml-2">Chatapp</h2>
            </header>
            {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
