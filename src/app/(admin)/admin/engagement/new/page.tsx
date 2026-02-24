import { requireAdmin } from '@/lib/admin/auth';
import PromptForm from '@/components/admin/PromptForm';

export const metadata = {
  title: 'New Prompt | YoursTruly Admin',
};

export default async function NewPromptPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2a1f1a]">New Engagement Prompt</h1>
        <p className="text-[#2a1f1a]/60 mt-1">
          Create a new prompt template for user engagement
        </p>
      </div>

      <PromptForm mode="create" />
    </div>
  );
}
