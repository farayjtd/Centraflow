'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createWarehouse(formData: {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  photo_url?: string;
  kepala_wh_id?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('warehouses').insert({
    ...formData,
    kepala_wh_id: formData.kepala_wh_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath('/dashboard/warehouse');
  return { success: true };
}

export async function updateWarehouse(id: string, formData: {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  photo_url?: string;
  kepala_wh_id?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('warehouses')
    .update({
      ...formData,
      kepala_wh_id: formData.kepala_wh_id || null,
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/warehouse');
  return { success: true };
}

export async function deleteWarehouse(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/warehouse');
  return { success: true };
}