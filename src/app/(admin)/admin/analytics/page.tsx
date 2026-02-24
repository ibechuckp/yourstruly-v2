import { requireAdmin } from '@/lib/admin/auth';
import { createClient } from '@/lib/supabase/server';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { subDays, format } from 'date-fns';

export const metadata = {
  title: 'Analytics | YoursTruly Admin',
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : subDays(to, 30);
  
  const supabase = await createClient();
  
  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  // Get DAU (users active in last 24 hours)
  const yesterday = subDays(new Date(), 1).toISOString();
  const { count: dau } = await supabase
    .from('engagement_stats')
    .select('*', { count: 'exact', head: true })
    .gte('last_engagement_date', yesterday.slice(0, 10));
  
  // Get MAU (users active in last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const { count: mau } = await supabase
    .from('engagement_stats')
    .select('*', { count: 'exact', head: true })
    .gte('last_engagement_date', thirtyDaysAgo.slice(0, 10));
  
  // Get new users in period
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());
  
  // Get total memories
  const { count: totalMemories } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true });
  
  // Get engagement stats
  const { data: engagementStats } = await supabase
    .from('engagement_stats')
    .select('total_prompts_answered, total_prompts_shown');
  
  const totalTilesCompleted = engagementStats?.reduce(
    (sum, stat) => sum + (stat.total_prompts_answered || 0), 
    0
  ) || 0;
  
  const totalShown = engagementStats?.reduce(
    (sum, stat) => sum + (stat.total_prompts_shown || 0), 
    0
  ) || 0;
  
  // Calculate XP (estimate: 10 XP per response)
  const totalXpEarned = totalTilesCompleted * 10;
  
  // Calculate engagement rate
  const engagementRate = totalShown > 0 
    ? Math.round((totalTilesCompleted / totalShown) * 100) 
    : 0;
  
  // Get daily stats for chart
  const days: Array<{
    date: string;
    active_users: number;
    new_users: number;
    memories_created: number;
    engagement_responses: number;
  }> = [];
  
  for (let i = 0; i <= 30; i++) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    days.unshift({
      date: dateStr,
      active_users: 0,
      new_users: 0,
      memories_created: 0,
      engagement_responses: 0,
    });
  }
  
  // Fetch actual data for the last 30 days
  const fromStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  
  const { data: dailyNewUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', `${fromStr}T00:00:00`)
    .order('created_at', { ascending: true });
  
  const { data: dailyMemories } = await supabase
    .from('memories')
    .select('created_at')
    .gte('created_at', `${fromStr}T00:00:00`)
    .order('created_at', { ascending: true });
  
  const { data: dailyResponses } = await supabase
    .from('engagement_prompts')
    .select('answered_at')
    .not('answered_at', 'is', null)
    .gte('answered_at', `${fromStr}T00:00:00`)
    .order('answered_at', { ascending: true });
  
  // Aggregate by date
  dailyNewUsers?.forEach((u) => {
    const date = format(new Date(u.created_at), 'yyyy-MM-dd');
    const day = days.find((d) => d.date === date);
    if (day) day.new_users++;
  });
  
  dailyMemories?.forEach((m) => {
    const date = format(new Date(m.created_at), 'yyyy-MM-dd');
    const day = days.find((d) => d.date === date);
    if (day) day.memories_created++;
  });
  
  dailyResponses?.forEach((r) => {
    if (r.answered_at) {
      const date = format(new Date(r.answered_at), 'yyyy-MM-dd');
      const day = days.find((d) => d.date === date);
      if (day) day.engagement_responses++;
    }
  });
  
  // Get active users per day (approximate from engagement_stats)
  const { data: activeUsersData } = await supabase
    .from('engagement_stats')
    .select('last_engagement_date');
  
  activeUsersData?.forEach((u) => {
    if (u.last_engagement_date) {
      const date = u.last_engagement_date;
      const day = days.find((d) => d.date === date);
      if (day) day.active_users++;
    }
  });
  
  // Get category breakdown
  const { data: categoryData } = await supabase
    .from('engagement_prompts')
    .select('category')
    .not('category', 'is', null);
  
  const categoryCounts: Record<string, { count: number; xp: number }> = {};
  categoryData?.forEach((item) => {
    const cat = item.category || 'uncategorized';
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { count: 0, xp: 0 };
    }
    categoryCounts[cat].count++;
    categoryCounts[cat].xp += 10;
  });
  
  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([category, data]) => ({
      category,
      count: data.count,
      xp: data.xp,
    }))
    .sort((a, b) => b.count - a.count);
  
  const analyticsData = {
    dau: dau || 0,
    mau: mau || 0,
    newUsers: newUsers || 0,
    activeUsers: mau || 0,
    totalUsers: totalUsers || 0,
    totalMemories: totalMemories || 0,
    totalTilesCompleted,
    totalXpEarned,
    engagementRate,
    dailyStats: days,
    categoryBreakdown,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2a1f1a]">Analytics</h1>
          <p className="text-[#2a1f1a]/60 mt-1">
            Platform metrics and user engagement insights
          </p>
        </div>
      </div>

      <AnalyticsDashboard 
        data={analyticsData} 
        dateRange={{ from: from.toISOString(), to: to.toISOString() }} 
      />
    </div>
  );
}
