
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PlusCircle, ArrowLeft } from 'lucide-react';
import type { Status } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type StatusWithId = Status & { id: string };

type StatusGroup = {
  userId: string;
  userName: string;
  userAvatar: string;
  statuses: StatusWithId[];
  lastUpdate: any;
};

export default function StatusPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [selectedStatus, setSelectedStatus] = React.useState<StatusGroup | null>(null);
  const [statusIndex, setStatusIndex] = React.useState(0);

  const statusQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    return query(
      collection(firestore, 'status'),
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: statuses, isLoading: isLoadingStatuses } = useCollection<StatusWithId>(statusQuery);

  const groupedStatuses = React.useMemo(() => {
    if (!statuses) return {};
    return statuses.reduce((acc, status) => {
      if (!acc[status.userId]) {
        acc[status.userId] = {
          userId: status.userId,
          userName: status.userName,
          userAvatar: status.userAvatar,
          statuses: [],
          lastUpdate: status.createdAt,
        };
      }
      acc[status.userId].statuses.push(status);
      if (status.createdAt > acc[status.userId].lastUpdate) {
        acc[status.userId].lastUpdate = status.createdAt;
      }
      return acc;
    }, {} as Record<string, StatusGroup>);
  }, [statuses]);

  const sortedStatusGroups = React.useMemo(() => {
    return Object.values(groupedStatuses).sort((a, b) => b.lastUpdate.toMillis() - a.lastUpdate.toMillis());
  }, [groupedStatuses]);

  const openStatus = (statusGroup: StatusGroup) => {
    setSelectedStatus(statusGroup);
    setStatusIndex(0);
  };
  
  const closeStatus = () => {
    setSelectedStatus(null);
  };

  const nextStatusItem = () => {
    if (selectedStatus && statusIndex < selectedStatus.statuses.length - 1) {
      setStatusIndex(prev => prev + 1);
    } else {
      closeStatus();
    }
  };

  React.useEffect(() => {
    if (selectedStatus) {
      const timer = setTimeout(nextStatusItem, 5000); // 5 seconds per status
      return () => clearTimeout(timer);
    }
  }, [selectedStatus, statusIndex]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoadingStatuses || isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const myStatusGroup = user ? groupedStatuses[user.uid] : undefined;

  return (
    <div className="h-full p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-headline text-2xl font-semibold">Status</h1>
        <Button onClick={() => router.push('/status/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Status
        </Button>
      </div>

      <div className="space-y-4">
        {user && (
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => myStatusGroup ? openStatus(myStatusGroup) : router.push('/status/create')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName || ''} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">My Status</p>
                <p className="text-sm text-muted-foreground">
                  {myStatusGroup ? `Last update ${formatTimestamp(myStatusGroup.lastUpdate)}` : 'Add to your status'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <h2 className="text-sm font-semibold text-muted-foreground pt-4">RECENT UPDATES</h2>

        {sortedStatusGroups.filter(group => group.userId !== user?.uid).map(group => (
          <Card
            key={group.userId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openStatus(group)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={group.userAvatar} alt={group.userName} />
                <AvatarFallback>{group.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{group.userName}</p>
                <p className="text-sm text-muted-foreground">{formatTimestamp(group.lastUpdate)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {sortedStatusGroups.length === (myStatusGroup ? 1 : 0) && (
            <p className="text-center text-muted-foreground pt-10">No recent updates from your contacts.</p>
        )}
      </div>

      <Dialog open={!!selectedStatus} onOpenChange={(open) => !open && closeStatus()}>
        <DialogContent className="p-0 m-0 bg-black/90 border-0 w-full h-full max-w-full max-h-full sm:rounded-none">
          {selectedStatus && (
            <div className="relative h-full w-full flex flex-col items-center justify-center text-white">
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={closeStatus} className="text-white hover:bg-white/20 hover:text-white">
                            <ArrowLeft />
                        </Button>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedStatus.userAvatar} />
                            <AvatarFallback>{selectedStatus.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{selectedStatus.userName}</p>
                            <p className="text-xs">{formatTimestamp(selectedStatus.statuses[statusIndex].createdAt)}</p>
                        </div>
                    </div>
                </div>

                <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                    {selectedStatus.statuses.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full">
                            <div className={`h-1 rounded-full ${idx < statusIndex ? 'bg-white' : ''} ${idx === statusIndex ? 'bg-white animate-progress' : ''}`} style={{animationDuration: '5s'}}></div>
                        </div>
                    ))}
                </div>
                
                <div className="relative w-full h-full flex items-center justify-center">
                    {selectedStatus.statuses[statusIndex].imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={selectedStatus.statuses[statusIndex].imageUrl}
                            alt="Status"
                            className="max-h-[80vh] max-w-full object-contain"
                        />
                    )}
                    {selectedStatus.statuses[statusIndex].text && (
                        <div className="absolute bottom-10 left-0 right-0 p-4 bg-black/50 text-center">
                            <p className="text-lg md:text-2xl">{selectedStatus.statuses[statusIndex].text}</p>
                        </div>
                    )}
                </div>
                <style jsx>{`
                    @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                    .animate-progress {
                        animation: progress linear;
                    }
                `}</style>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


    