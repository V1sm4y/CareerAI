import React, { useState } from 'react';
import { X, Building2, Briefcase, Calendar, StickyNote } from 'lucide-react';
import type { JobApplication, ApplicationCreate, ApplicationStatus } from '../../types';

const STATUSES: ApplicationStatus[] = [
  'Applied', 'OA Scheduled', 'Interview', 'Rejected', 'Offer', 'Accepted',
];

interface Props {
  onSubmit: (data: ApplicationCreate) => Promise<void>;
  onClose: () => void;
  initial?: JobApplication;
}

export default function ApplicationForm({ onSubmit, onClose, initial }: Props) {
  const [form, setForm] = useState<ApplicationCreate>({
    company_name: initial?.company_name ?? '',
    role: initial?.role ?? '',
    date_applied: initial?.date_applied ?? new Date().toISOString().slice(0, 10),
    status: initial?.status ?? 'Applied',
    notes: initial?.notes ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.role.trim()) {
      setError('Company name and role are required.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            {initial ? 'Edit Application' : 'New Application'}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Company Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handle}
                  placeholder="Google, Apple..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Role *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                <input
                  name="role"
                  value={form.role}
                  onChange={handle}
                  placeholder="Software Engineer"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Date Applied</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                <input
                  type="date"
                  name="date_applied"
                  value={form.date_applied}
                  onChange={handle}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Status</label>
              <select name="status" value={form.status} onChange={handle} className="input-field">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Notes</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
              <textarea
                name="notes"
                value={form.notes}
                onChange={handle}
                rows={3}
                placeholder="Interview notes, contacts, follow-up dates..."
                className="input-field pl-10 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
