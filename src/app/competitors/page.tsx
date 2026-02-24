import { CheckCircle, XCircle, Minus, Star, TrendingUp, Target, Zap } from 'lucide-react';

export const metadata = {
  title: 'Competitor Analysis | YoursTruly',
  description: 'How YoursTruly compares to other digital legacy platforms',
};

const competitors = [
  { name: 'YoursTruly', price: 'TBD', voice: true, video: true, futureMsg: true, aiAvatar: true, book: 'soon', familyShare: 'soon', highlight: true },
  { name: 'StoryWorth', price: '$99/yr', voice: true, video: false, futureMsg: false, aiAvatar: false, book: true, familyShare: true },
  { name: 'Remento', price: '$84-99/yr', voice: true, video: true, futureMsg: false, aiAvatar: false, book: true, familyShare: true },
  { name: 'HeritageWhisper', price: '$79/yr', voice: true, video: false, futureMsg: false, aiAvatar: false, book: true, familyShare: true },
  { name: 'Capsle Stories', price: '~$70/yr', voice: true, video: true, futureMsg: false, aiAvatar: false, book: false, familyShare: true },
  { name: 'Klokbox', price: 'Free/$5/mo', voice: true, video: true, futureMsg: 'limited', aiAvatar: false, book: false, familyShare: true },
  { name: 'Eternos', price: '$25-49/mo', voice: true, video: true, futureMsg: false, aiAvatar: true, book: false, familyShare: true },
];

const features = [
  { 
    key: 'futureMsg', 
    name: 'Future Message Delivery', 
    description: 'Schedule messages to arrive on specific dates or after passing',
    ytAdvantage: true 
  },
  { 
    key: 'aiAvatar', 
    name: 'AI Avatar / Digital Twin', 
    description: 'Chat with a digital version of your loved one',
    ytAdvantage: true 
  },
  { key: 'voice', name: 'Voice Recording', description: 'Record stories with your voice' },
  { key: 'video', name: 'Video Recording', description: 'Capture video memories' },
  { key: 'book', name: 'Physical Book', description: 'Print memories as a keepsake book' },
  { key: 'familyShare', name: 'Family Sharing', description: 'Share with family members' },
];

const uniqueAdvantages = [
  {
    icon: Zap,
    title: 'PostScripts™',
    description: 'Schedule messages to arrive on birthdays, anniversaries, or "after I\'m gone" — no other platform offers this.',
    competitors: 'None',
  },
  {
    icon: Star,
    title: 'Gift Marketplace',
    description: 'Attach physical gifts (flowers, keepsakes) to your messages. They arrive together at the perfect moment.',
    competitors: 'None',
  },
  {
    icon: Target,
    title: 'Affordable AI Avatar',
    description: 'Create a digital version of yourself or loved ones at a fraction of competitor pricing.',
    competitors: 'Only Eternos ($300+/yr)',
  },
  {
    icon: TrendingUp,
    title: '3D Memory Globe',
    description: 'View your memories on an interactive 3D globe with face detection and smart organization.',
    competitors: 'None',
  },
];

const positioning = {
  tagline: "Don't just preserve the past. Deliver it to the future.",
  description: "While other platforms focus on capturing memories for viewing now, YoursTruly is the only platform that delivers your memories, messages, and gifts exactly when they matter most — even years from now.",
  pricing: [
    { tier: 'Free', price: '$0', features: ['5 memories', '1 PostScript', 'Basic features'] },
    { tier: 'Personal', price: '$79/yr', features: ['Unlimited memories', '12 PostScripts/year', 'Voice & video', 'AI organization'] },
    { tier: 'Family', price: '$149/yr', features: ['Everything in Personal', 'Family sharing', '24 PostScripts/year', 'AI Avatar lite'] },
    { tier: 'Legacy', price: '$249/yr', features: ['Everything in Family', 'Unlimited PostScripts', 'Full AI Avatar', 'Priority support'] },
  ],
};

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="w-5 h-5 text-[#406A56] mx-auto" />;
  if (value === false) return <XCircle className="w-5 h-5 text-[#C35F33]/40 mx-auto" />;
  if (value === 'soon') return <span className="text-xs text-[#D9C61A] font-medium">Soon</span>;
  if (value === 'limited') return <span className="text-xs text-[#8DACAB]">Limited</span>;
  return <Minus className="w-5 h-5 text-gray-300 mx-auto" />;
}

export default function CompetitorAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#F2F1E5]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#406A56] via-[#4A3552] to-[#2a1f1a] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How We Compare
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {positioning.tagline}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        
        {/* Unique Advantages */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#2a1f1a] text-center mb-4">
            What Makes Us Different
          </h2>
          <p className="text-center text-[#2a1f1a]/60 mb-12 max-w-2xl mx-auto">
            {positioning.description}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {uniqueAdvantages.map((advantage) => (
              <div 
                key={advantage.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#C35F33]/10 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#406A56] to-[#4A3552]">
                    <advantage.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2a1f1a] mb-2">
                      {advantage.title}
                    </h3>
                    <p className="text-[#2a1f1a]/70 text-sm mb-3">
                      {advantage.description}
                    </p>
                    <p className="text-xs text-[#406A56] font-medium">
                      Competitors with this: {advantage.competitors}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Matrix */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#2a1f1a] text-center mb-12">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-sm border border-[#C35F33]/10 overflow-hidden">
              <thead>
                <tr className="bg-[#2a1f1a] text-white">
                  <th className="text-left px-6 py-4 font-semibold">Platform</th>
                  <th className="text-center px-4 py-4 font-semibold">Price</th>
                  {features.map((f) => (
                    <th key={f.key} className="text-center px-4 py-4 font-semibold text-sm">
                      {f.name}
                      {f.ytAdvantage && <Star className="w-3 h-3 inline ml-1 text-[#D9C61A]" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, idx) => (
                  <tr 
                    key={comp.name}
                    className={`border-t border-[#C35F33]/10 ${
                      comp.highlight 
                        ? 'bg-gradient-to-r from-[#406A56]/10 to-[#4A3552]/10 font-medium' 
                        : idx % 2 === 0 ? 'bg-white' : 'bg-[#F2F1E5]/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className={comp.highlight ? 'text-[#406A56] font-bold' : 'text-[#2a1f1a]'}>
                        {comp.name}
                        {comp.highlight && <span className="ml-2 text-xs bg-[#406A56] text-white px-2 py-0.5 rounded-full">Us</span>}
                      </span>
                    </td>
                    <td className="text-center px-4 py-4 text-sm text-[#2a1f1a]/70">
                      {comp.price}
                    </td>
                    <td className="text-center px-4 py-4"><FeatureCell value={comp.futureMsg} /></td>
                    <td className="text-center px-4 py-4"><FeatureCell value={comp.aiAvatar} /></td>
                    <td className="text-center px-4 py-4"><FeatureCell value={comp.voice} /></td>
                    <td className="text-center px-4 py-4"><FeatureCell value={comp.video} /></td>
                    <td className="text-center px-4 py-4"><FeatureCell value={comp.book} /></td>
                    <td className="text-center px-4 py-4"><FeatureCell value={comp.familyShare} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-center text-sm text-[#2a1f1a]/50 mt-4">
            <Star className="w-3 h-3 inline text-[#D9C61A] mr-1" />
            = YoursTruly unique advantage
          </p>
        </section>

        {/* Pricing Preview */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#2a1f1a] text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-[#2a1f1a]/60 mb-12">
            More features, better price than competitors charging $300+/year
          </p>
          
          <div className="grid md:grid-cols-4 gap-4">
            {positioning.pricing.map((tier, idx) => (
              <div 
                key={tier.tier}
                className={`rounded-2xl p-6 ${
                  idx === 2 
                    ? 'bg-gradient-to-br from-[#406A56] to-[#4A3552] text-white ring-4 ring-[#D9C61A]' 
                    : 'bg-white border border-[#C35F33]/10'
                }`}
              >
                {idx === 2 && (
                  <span className="text-xs bg-[#D9C61A] text-[#2a1f1a] px-2 py-1 rounded-full font-medium mb-3 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${idx === 2 ? 'text-white' : 'text-[#2a1f1a]'}`}>
                  {tier.tier}
                </h3>
                <p className={`text-3xl font-bold mb-4 ${idx === 2 ? 'text-white' : 'text-[#406A56]'}`}>
                  {tier.price}
                </p>
                <ul className="space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className={`text-sm flex items-start gap-2 ${idx === 2 ? 'text-white/90' : 'text-[#2a1f1a]/70'}`}>
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${idx === 2 ? 'text-[#D9C61A]' : 'text-[#406A56]'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-[#406A56] to-[#4A3552] rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Preserve Your Legacy?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join thousands of families who trust YoursTruly to capture, preserve, and deliver their most precious memories.
          </p>
          <a 
            href="/signup"
            className="inline-block bg-white text-[#406A56] font-semibold px-8 py-4 rounded-xl hover:shadow-lg transition-shadow"
          >
            Start Free Today
          </a>
        </section>
      </div>

      {/* Footer note */}
      <div className="text-center py-8 text-sm text-[#2a1f1a]/40">
        Comparison data updated February 2026. Competitor features may change.
      </div>
    </div>
  );
}
