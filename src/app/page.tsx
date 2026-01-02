import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  redirect('/dashboard');
}
