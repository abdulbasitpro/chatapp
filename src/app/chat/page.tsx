import { MessageCircle } from 'lucide-react';

export default function ChatHomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card/50 text-card-foreground">
      <div className="text-center">
        <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 font-headline text-2xl font-semibold">Select a room</h2>
        <p className="mt-2 text-muted-foreground">
          Choose a room from the sidebar to start chatting.
        </p>
      </div>
    </div>
  );
}
