import { requireAdmin } from '@/lib/admin/auth';
import { Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';

export default async function MarketplacePage() {
  await requireAdmin();

  const stats = [
    { label: 'Total Products', value: '0', icon: Package, change: '+0%' },
    { label: 'Active Orders', value: '0', icon: ShoppingBag, change: '+0%' },
    { label: 'Revenue (MTD)', value: '$0', icon: TrendingUp, change: '+0%' },
    { label: 'Providers', value: '0', icon: Users, change: '+0%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2a1f1a]">Marketplace</h1>
        <p className="text-[#2a1f1a]/60 mt-1">Manage products, orders, and providers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#C35F33]/10">
            <div className="flex items-center justify-between">
              <stat.icon className="w-8 h-8 text-[#406A56]" />
              <span className="text-xs text-[#406A56]">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-[#2a1f1a] mt-2">{stat.value}</p>
            <p className="text-sm text-[#2a1f1a]/60">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder */}
      <div className="p-12 bg-white/40 backdrop-blur-sm rounded-xl border border-[#C35F33]/10 text-center">
        <Package className="w-16 h-16 mx-auto text-[#C35F33]/30" />
        <h3 className="text-lg font-medium text-[#2a1f1a] mt-4">Marketplace Coming Soon</h3>
        <p className="text-[#2a1f1a]/60 mt-2 max-w-md mx-auto">
          Product management, order tracking, and provider administration will be available here.
        </p>
      </div>
    </div>
  );
}
