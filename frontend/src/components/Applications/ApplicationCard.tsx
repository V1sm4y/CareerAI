import React from 'react';
import { Building2, Calendar, Pencil, Trash2 } from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../../types';

const statusClass: Record<ApplicationStatus, string> = {
  'Applied': 'status-applied',
  'OA Scheduled': 'status-oa',
  'Interview': 'status-interview',
  'Rejected': 'status-rejected',
  'Offer': 'status-offer',
  'Accepted': 'status-accepted',
};

interface Props {
  app: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: number) => void;
}

export default function ApplicationCard({ app, onEdit, onDelete }: Props) {
  return (
    <div className="glass-card group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/20 to-brand-400/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{app.company_name}</h3>
            <p className="text-white/50 text-sm">{app.role}</p>
          </div>
        </div>
        <span className={statusClass[app.status as ApplicationStatus] || 'badge bg-gray-500/20 text-gray-400'}>
          {app.status}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
        <Calendar className="w-3.5 h-3.5" />
        Applied {new Date(app.date_applied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>

      {app.notes && (
        <p className="text-white/50 text-sm mb-4 line-clamp-2 border-l-2 border-brand-500/30 pl-3">{app.notes}</p>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={() => onEdit(app)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 !py-2 !text-sm">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={() => onDelete(app.id)} className="btn-danger flex-1 flex items-center justify-center gap-1.5 !text-sm">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
