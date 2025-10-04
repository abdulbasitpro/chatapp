
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useStorage, addDocumentNonBlocking } from '@/firebase';
import { serverTimestamp, collection, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function CreateStatusPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [text, setText] = React.useState('');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || (!text.trim() && !imageFile)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Status must have text or an image.' });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined = undefined;

      if (imageFile) {
        const filePath = `status_files/${user.uid}/${Date.now()}_${imageFile.name}`;
        const fileStorageRef = storageRef(storage, filePath);
        const uploadTask = await uploadBytesResumable(fileStorageRef, imageFile);
        imageUrl = await getDownloadURL(uploadTask.ref);
      }

      const statusCollection = collection(firestore, 'status');
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);

      await addDocumentNonBlocking(statusCollection, {
        userId: user.uid,
        userName: user.displayName,
        userAvatar: `https://i.pravatar.cc/150?u=${user.uid}`,
        text: text.trim() || '',
        imageUrl,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      toast({ title: 'Status Posted!' });
      router.push('/status');

    } catch (error) {
      console.error('Error creating status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not post your status.' });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    router.replace('/');
    return null;
  }

  return (
    <div className="h-full p-4 md:p-6">
       <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="font-headline text-2xl font-semibold">Create Status</h1>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>What's on your mind?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              placeholder="Type your status update..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] text-lg"
              disabled={isSubmitting}
            />

            <div className="space-y-2">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {imagePreview ? "Change Image" : "Add Image"}
                </Button>

                {imagePreview && (
                    <div className="relative w-full max-w-sm h-64 mt-2">
                       <Image src={imagePreview} alt="Image preview" layout="fill" className="rounded-md object-cover" />
                    </div>
                )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || (!text.trim() && !imageFile)}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Status'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


    