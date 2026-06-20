import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WarehouseClient } from './WarehouseClient';

export default async function WarehousePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');
  if (!currentUser.roles.some((r) => ['Admin', 'Kepala_WH'].includes(r))) redirect('/dashboard');

  const supabase = await createClient();

  const [{ data: warehouses }, { data: kepalawh }] = await Promise.all([
    supabase
      .from('warehouses')
      .select('*, kepala_wh:kepala_wh_id(id, full_name, avatar_url)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('is_active', true)
      .in('id',
        (await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'Kepala_WH')
        ).data?.map((r) => r.user_id) ?? []
      ),
  ]);

  return <WarehouseClient warehouses={warehouses ?? []} kepalaWhList={kepalawh ?? []} />;
}