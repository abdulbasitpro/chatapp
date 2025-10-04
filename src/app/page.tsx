'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    router.push('/chat');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Welcome to Chatify</CardTitle>
            <CardDescription>Enter your credentials to start chatting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" variant="default">
                Login <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="underline text-primary font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
