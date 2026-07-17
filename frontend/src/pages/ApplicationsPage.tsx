import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Filter, Briefcase } from 'lucide-react';
import { applicationsApi } from '../services/api';
import Header from '../components/Layout/Header';
import ApplicationCard from '../components/Applications/ApplicationCard';
import ApplicationForm from '../components/Applications/ApplicationForm';
import type { JobApplication, ApplicationCreate, ApplicationStatus } from '../types';

const ALL_STATUSES: ApplicationStatus[] = [
  'Applied', 'OA Scheduled', 'Interview', 'Rejected', 'Offer', 'Accepted',
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<JobApplication | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');

  const load = async () => {
    try {
      const res = await applicationsApi.list();
      setApps(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const matchSearch =
        a.company_name.toLowerCase().includes(search.toLowerCase()) ||
        a.role.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [apps, search, statusFilter]);

  const handleCreate = async (data: ApplicationCreate) => {
    const res = await applicationsApi.create(data);
    setApps((prev) => [res.data, ...prev]);
    setShowForm(false);
  };

  const handleUpdate = async (data: ApplicationCreate) => {
    if (!editTarget) return;
    const res = await applicationsApi.update(editTarget.id, data);
    setApps((prev) => prev.map((a) => (a.id === editTarget.id ? res.data : a)));
    setEditTarget(undefined);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this application?')) return;
    await applicationsApi.delete(id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const openEdit = (app: JobApplication) => {
    setEditTarget(app);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(undefined);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Applications"
        subtitle={`${apps.length} total application${apps.length !== 1 ? 's' : ''}`}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 !py-2.5"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-white/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'All')}
              className="input-field pl-9 !py-2.5 pr-8 w-full sm:w-auto"
            >
              <option value="All">All Statuses</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-medium">
              {search || statusFilter !== 'All' ? 'No matching applications' : 'No applications yet'}
            </p>
            <p className="text-white/25 text-sm mt-1">
              {search || statusFilter !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Click "Add Application" to track your first job application'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ApplicationForm
          initial={editTarget}
          onSubmit={editTarget ? handleUpdate : handleCreate}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
