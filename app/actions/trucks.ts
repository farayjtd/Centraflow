'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { TruckType, TruckStatus } from '@/lib/types';

export async function createTruck(formData: {
  plate_number: string;
  truck_type: TruckType;
  status: TruckStatus;
  photo_url?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('trucks').insert(formData);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/truck');
  return { success: true };
}

export async function updateTruck(id: string, formData: {
  plate_number: string;
  truck_type: TruckType;
  status: TruckStatus;
  photo_url?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('trucks').update(formData).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/truck');
  return { success: true };
}

export async function deleteTruck(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('trucks').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/truck');
  return { success: true };
}