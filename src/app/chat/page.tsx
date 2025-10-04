import { MessageCircle } from 'lucide-react';

export default function ChatHomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/30 text-card-foreground">
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 font-bold text-2xl">Select a room</h2>
        <p className="mt-2 text-muted-foreground">
          Choose a room from the sidebar to start chatting, or create a new one.
        </p>
      </div>
    </div>
  );
}
