import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TruckClient } from './TruckClient';

export default async function TruckPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');
  if (!currentUser.roles.some((r) => ['Admin', 'Kepala_WH', 'Sopir'].includes(r))) redirect('/dashboard');

  const supabase = await createClient();
  const { data: trucks } = await supabase
    .from('trucks')
    .select('*')
    .order('created_at', { ascending: false });

  return <TruckClient trucks={trucks ?? []} />;
}