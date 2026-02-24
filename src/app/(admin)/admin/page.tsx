import { requireAdmin } from '@/lib/admin/auth';
import { getAuditStats } from '@/lib/admin/audit';
import { createClient } from '@/lib/supabase/server';
import { 
  Users, 
  UserPlus, 
  Activity, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  CheckCircle
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  
  // Fetch stats
  const [
    { count: totalUsers },
    { count: newUsersToday },
    { count: activeSubscriptions },
    auditStats,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    getAuditStats(7),
  ]);

  const statsCards = [
    {
      title: 'Total Users',
      value: totalUsers?.toLocaleString() || '0',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-[#406A56] to-[#4A7A66]',
    },
    {
      title: 'New Today',
      value: newUsersToday?.toString() || '0',
      change: '+5',
      changeType: 'positive' as const,
      icon: UserPlus,
      color: 'from-[#C35F33] to-[#D37F53]',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions?.toLocaleString() || '0',
      change: '+8%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'from-[#D9C61A] to-[#E9D63A]',
    },
    {
      title: 'Admin Actions (7d)',
      value: auditStats.totalActions.toString(),
      change: auditStats.totalActions > 100 ? '+15%' : '-5%',
      changeType: auditStats.totalActions > 100 ? 'positive' : 'negative' as const,
      icon: Activity,
      color: 'from-[#8DACAB] to-[#9DBCBD]',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2a1f1a]">
          Welcome back, {admin.email?.split('@')[0]}
        </h1>
        <p className="text-[#2a1f1a]/60 mt-1">
          Here&apos;s what&apos;s happening with your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="glass p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2a1f1a]/60">{stat.title}</p>
                  <p className="text-3xl font-bold text-[#2a1f1a] mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4 text-[#406A56]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-[#C35F33]" />
                )}
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-[#406A56]' : 'text-[#C35F33]'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-[#2a1f1a]/40 ml-1">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#2a1f1a]">Recent Admin Activity</h2>
            <a href="/admin/settings?tab=audit" className="text-sm text-[#406A56] hover:underline">
              View all
            </a>
          </div>
          
          <div className="space-y-4">
            {auditStats.topAdmins.slice(0, 5).map((adminActivity, index) => (
              <div
                key={adminActivity.admin_email}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#406A56]/20 to-[#C35F33]/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#406A56]">
                    {adminActivity.admin_email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2a1f1a]">
                    {adminActivity.admin_email}
                  </p>
                  <p className="text-xs text-[#2a1f1a]/50">
                    {adminActivity.count} actions this week
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#2a1f1a]/40">
                  <Clock className="w-3 h-3" />
                  <span>Active</span>
                </div>
              </div>
            ))}
            
            {auditStats.topAdmins.length === 0 && (
              <div className="text-center py-8 text-[#2a1f1a]/40">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No admin activity recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-[#2a1f1a] mb-6">Quick Actions</h2>
          
          <div className="space-y-3">
            <QuickAction
              href="/admin/users"
              icon={Users}
              label="Manage Users"
              description="View and edit user accounts"
            />
            <QuickAction
              href="/admin/settings"
              icon={ShieldAlert}
              label="Feature Flags"
              description="Toggle platform features"
            />
            <QuickAction
              href="/admin/analytics"
              icon={TrendingUp}
              label="View Analytics"
              description="Check platform metrics"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-[#C35F33]/10">
            <h3 className="text-sm font-medium text-[#2a1f1a]/60 mb-3">Actions by Type</h3>
            <div className="space-y-2">
              {Object.entries(auditStats.actionsByType)
                .slice(0, 4)
                .map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between text-sm">
                    <span className="text-[#2a1f1a]/70 capitalize">
                      {action.replace(/:/g, ' ')}
                    </span>
                    <span className="font-medium text-[#2a1f1a]">{count}</span>
                  </div>
                ))}
              {Object.keys(auditStats.actionsByType).length === 0 && (
                <p className="text-sm text-[#2a1f1a]/40 italic">No actions recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/80 transition-colors group"
    >
      <div className="p-2 rounded-lg bg-[#406A56]/10 group-hover:bg-[#406A56]/20 transition-colors">
        <Icon className="w-4 h-4 text-[#406A56]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#2a1f1a]">{label}</p>
        <p className="text-xs text-[#2a1f1a]/50">{description}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-[#2a1f1a]/30 group-hover:text-[#406A56] transition-colors" />
    </a>
  );
}
