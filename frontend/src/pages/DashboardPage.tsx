import React, { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { applicationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';
import type { DashboardStats } from '../types';

const STATUS_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Applied':      { icon: Clock,       color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  'OA Scheduled': { icon: Clock,       color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  'Interview':    { icon: TrendingUp,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
  'Rejected':     { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-500/10' },
  'Offer':        { icon: Award,       color: 'text-green-400',   bg: 'bg-green-500/10' },
  'Accepted':     { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const STATUS_CLASS: Record<string, string> = {
  'Applied': 'status-applied', 'OA Scheduled': 'status-oa', 'Interview': 'status-interview',
  'Rejected': 'status-rejected', 'Offer': 'status-offer', 'Accepted': 'status-accepted',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationsApi.dashboard().then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Dashboard" subtitle="Your job search at a glance" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Greeting */}
        <div className="glass-card !p-5 bg-gradient-to-r from-brand-600/20 to-brand-400/10 border-brand-500/20">
          <h2 className="text-xl font-bold text-white">{greeting}, {user?.full_name?.split(' ')[0]} 👋</h2>
          <p className="text-white/50 text-sm mt-1">
            {stats?.total === 0
              ? 'Start by adding your first job application!'
              : `You're tracking ${stats?.total} application${stats?.total !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card col-span-2 lg:col-span-1 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats?.total ?? 0}</p>
              <p className="text-white/50 text-sm">Total Applications</p>
            </div>
          </div>

          {Object.entries(STATUS_META).slice(0, 3).map(([status, meta]) => {
            const Icon = meta.icon;
            const count = stats?.by_status?.[status] ?? 0;
            return (
              <div key={status} className="glass-card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${meta.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{count}</p>
                  <p className="text-white/50 text-sm">{status}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status breakdown + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="glass-card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" /> Status Breakdown
            </h3>
            {stats && stats.total > 0 ? (
              <div className="space-y-3">
                {Object.entries(STATUS_META).map(([status, meta]) => {
                  const count = stats.by_status?.[status] ?? 0;
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                  const Icon = meta.icon;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${meta.color} flex-shrink-0`} />
                      <span className="text-white/70 text-sm w-28 flex-shrink-0">{status}</span>
                      <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${meta.bg}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-sm w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No applications yet.</p>
            )}
          </div>

          {/* Recent Applications */}
          <div className="glass-card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" /> Recent Applications
            </h3>
            {stats?.recent && stats.recent.length > 0 ? (
              <div className="space-y-3">
                {stats.recent.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{app.company_name}</p>
                      <p className="text-white/40 text-xs">{app.role}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={STATUS_CLASS[app.status] ?? 'badge bg-gray-500/20 text-gray-400'}>
                        {app.status}
                      </span>
                      <span className="text-white/30 text-xs">
                        {new Date(app.date_applied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No recent applications.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
