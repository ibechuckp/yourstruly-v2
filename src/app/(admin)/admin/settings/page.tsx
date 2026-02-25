import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import FeatureFlagsList from '@/components/admin/FeatureFlagsList';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import SystemSettings from '@/components/admin/SystemSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/Tabs';

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const activeTab = params.tab || 'general';

  const supabase = createAdminClient();

  // Fetch feature flags
  const { data: featureFlags } = await supabase
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch system settings
  const { data: systemSettings } = await supabase
    .from('system_settings')
    .select('*')
    .order('key');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2a1f1a]">Settings</h1>
        <p className="text-[#2a1f1a]/60 mt-1">
          Manage feature flags, system configuration, and audit logs
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList className="glass p-1 inline-flex">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureFlagsList flags={featureFlags || []} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
