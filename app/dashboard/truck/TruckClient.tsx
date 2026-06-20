'use client';

import { useState, useTransition, useRef } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { createTruck, updateTruck, deleteTruck } from '@/app/actions/trucks';
import type { TruckType, TruckStatus } from '@/lib/types';

const TRUCK_TYPES: TruckType[] = ['Truk Besar', 'Engkel', 'Pick Up'];
const TRUCK_STATUSES: TruckStatus[] = ['Standby', 'On Delivery', 'Maintenance'];

const statusVariant: Record<TruckStatus, 'success' | 'info' | 'warning'> = {
  'Standby': 'success',
  'On Delivery': 'info',
  'Maintenance': 'warning',
};

type Truck = {
  id: string;
  display_id: string;
  plate_number: string;
  truck_type: TruckType;
  status: TruckStatus;
  photo_url: string | null;
  created_at: string;
};

type Props = { trucks: Truck[] };

const emptyForm = {
  plate_number: '',
  truck_type: 'Engkel' as TruckType,
  status: 'Standby' as TruckStatus,
  photo_url: '',
};

export function TruckClient({ trucks }: Props) {
  const [isPending, startTransition] = useTransition();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [deleteModal, setDeleteModal] = useState<Truck | null>(null);
  const [selected, setSelected] = useState<Truck | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = trucks.filter((t) =>
    t.plate_number.toLowerCase().includes(search.toLowerCase()) ||
    t.truck_type.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setPhotoPreview(null);
    setPhotoFile(null);
    setError('');
    setModalMode('create');
  };

  const openEdit = (t: Truck) => {
    setSelected(t);
    setForm({
      plate_number: t.plate_number,
      truck_type: t.truck_type,
      status: t.status,
      photo_url: t.photo_url ?? '',
    });
    setPhotoPreview(t.photo_url);
    setPhotoFile(null);
    setError('');
    setModalMode('edit');
  };

  const openDetail = (t: Truck) => {
    setSelected(t);
    setModalMode('detail');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload-truck-photo', { method: 'POST', body: fd });
      const result = await res.json();
      if (result.error) { setError(result.error); return null; }
      return result.url;
    } catch {
      setError('Gagal upload foto.');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = () => {
    if (!form.plate_number.trim()) return setError('Plat nomor harus diisi.');
    setError('');

    startTransition(async () => {
      try {
        let photoUrl = form.photo_url || undefined;
        if (photoFile) {
          const uploaded = await uploadPhoto(photoFile);
          if (!uploaded) return;
          photoUrl = uploaded;
        }

        const payload = {
          plate_number: form.plate_number.toUpperCase(),
          truck_type: form.truck_type,
          status: form.status,
          photo_url: photoUrl,
        };

        const result = modalMode === 'create'
          ? await createTruck(payload)
          : await updateTruck(selected!.id, payload);

        if (result?.error) setError(result.error);
        else setModalMode(null);
      } catch {
        setError('Terjadi kesalahan.');
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    startTransition(async () => {
      await deleteTruck(deleteModal.id);
      setDeleteModal(null);
    });
  };

  // Radio group helper
  const RadioGroup = ({ label, options, value, onChange }: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((opt) => (
          <label key={opt} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
            border: `1.5px solid ${value === opt ? 'var(--primary)' : 'var(--border)'}`,
            backgroundColor: value === opt ? '#EFF6FF' : 'transparent',
            fontSize: '13px',
            color: value === opt ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: value === opt ? '600' : '400',
            userSelect: 'none' as const,
          }}>
            <input type="radio" checked={value === opt}
              onChange={() => onChange(opt)} style={{ display: 'none' }} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );

  const columns = [
    { key: 'display_id', label: 'ID', width: '90px' },
    {
      key: 'plate_number', label: 'Truck',
      render: (t: Truck) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            backgroundColor: '#EFF6FF', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {t.photo_url
              ? <img src={t.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '20px' }}>🚛</span>
            }
          </div>
          <div>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px', letterSpacing: '0.5px' }}>
              {t.plate_number}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.truck_type}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (t: Truck) => <Badge label={t.status} variant={statusVariant[t.status]} />,
    },
    {
      key: 'created_at', label: 'Dibuat',
      render: (t: Truck) => new Date(t.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
    },
    {
      key: 'actions', label: 'Aksi', width: '180px',
      render: (t: Truck) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="ghost" onClick={() => openDetail(t)}>Detail</Button>
          <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteModal(t)}>Hapus</Button>
        </div>
      ),
    },
  ];

  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: '8px', padding: '10px 12px',
          color: 'var(--error)', fontSize: '13px',
        }}>{error}</div>
      )}

      {/* Photo Upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Foto Truck</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', height: '140px', borderRadius: '8px',
            border: '2px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', backgroundColor: '#F8FAFC',
          }}
        >
          {photoPreview
            ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '6px' }}>🚛</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Klik untuk upload foto</div>
              </div>
            )
          }
        </div>
        <input ref={fileInputRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handlePhotoChange} />
        {photoPreview && (
          <button type="button"
            onClick={() => { setPhotoPreview(null); setPhotoFile(null); setForm({ ...form, photo_url: '' }); }}
            style={{ fontSize: '12px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            Hapus foto
          </button>
        )}
      </div>

      <Input label="Plat Nomor" value={form.plate_number}
        onChange={(v) => setForm({ ...form, plate_number: v.toUpperCase() })}
        placeholder="contoh: B 1234 ABC" required />

      <RadioGroup
        label="Tipe Truck"
        options={TRUCK_TYPES}
        value={form.truck_type}
        onChange={(v) => setForm({ ...form, truck_type: v as TruckType })}
      />

      <RadioGroup
        label="Status"
        options={TRUCK_STATUSES}
        value={form.status}
        onChange={(v) => setForm({ ...form, status: v as TruckStatus })}
      />
    </div>
  );

  const renderDetail = () => {
    if (!selected) return null;
    const rows = [
      { label: 'ID', value: selected.display_id },
      { label: 'Plat Nomor', value: selected.plate_number },
      { label: 'Tipe', value: selected.truck_type },
      { label: 'Status', value: selected.status },
      {
        label: 'Dibuat', value: new Date(selected.created_at).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      },
    ];

    return (
      <div>
        {/* Photo */}
        <div style={{
          width: '100%', height: '180px', borderRadius: '10px',
          backgroundColor: '#EFF6FF', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {selected.photo_url
            ? <img src={selected.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '56px' }}>🚛</span>
          }
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Badge label={selected.status} variant={statusVariant[selected.status]} />
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((row, i) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', minWidth: '100px' }}>
                {row.label}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600', textAlign: 'right' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Truck
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {trucks.length} truck terdaftar
          </p>
        </div>
        <Button onClick={openCreate}>+ Tambah Truck</Button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari plat, tipe, status..."
          style={{
            width: '100%', padding: '10px 12px',
            border: '1px solid var(--border)', borderRadius: '8px',
            fontSize: '14px', color: 'var(--text-primary)',
            backgroundColor: 'var(--surface)', outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '12px',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        <Table columns={columns} data={filtered}
          keyExtractor={(t) => t.id} emptyText="Belum ada truck" />
      </div>

      {/* Modal Create */}
      <Modal open={modalMode === 'create'} onClose={() => setModalMode(null)}
        title="Tambah Truck Baru" width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMode(null)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isPending || uploadingPhoto}>
              {isPending ? 'Menyimpan...' : 'Buat Truck'}
            </Button>
          </>
        }>
        {renderForm()}
      </Modal>

      {/* Modal Edit */}
      <Modal open={modalMode === 'edit'} onClose={() => setModalMode(null)}
        title={`Edit Truck — ${selected?.plate_number}`} width={480}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMode(null)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isPending || uploadingPhoto}>
              {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }>
        {renderForm()}
      </Modal>

      {/* Modal Detail */}
      <Modal open={modalMode === 'detail'} onClose={() => setModalMode(null)}
        title="Detail Truck" width={440}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMode(null)}>Tutup</Button>
            <Button onClick={() => { setModalMode(null); openEdit(selected!); }}>Edit Truck</Button>
          </>
        }>
        {renderDetail()}
      </Modal>

      {/* Modal Hapus */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}
        title="Konfirmasi Hapus Truck" width={400}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Batal</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Menghapus...' : 'Ya, Hapus Permanen'}
            </Button>
          </>
        }>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Truck <strong style={{ color: 'var(--text-primary)' }}>{deleteModal?.plate_number}</strong> akan dihapus permanen.
          Tindakan ini <strong style={{ color: 'var(--error)' }}>tidak dapat dibatalkan</strong>.
        </p>
      </Modal>
    </div>
  );
}