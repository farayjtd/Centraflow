'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PhotoStatus } from '@/lib/types';

export async function uploadProgressPhoto(formData: {
  project_id: string;
  photo_url: string;
  notes: string;
}) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  const { error } = await supabase.from('progress_photos').insert({
    ...formData,
    uploaded_by: user?.id,
    status: 'Pending',
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/proyek');
  return { success: true };
}

export async function reviewProgressPhoto(
  id: string,
  status: PhotoStatus,
) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  const { error } = await supabase
    .from('progress_photos')
    .update({ status, approved_by: user?.id })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/proyek');
  return { success: true };
}

export async function deleteProgressPhoto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('progress_photos').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/proyek');
  return { success: true };
}