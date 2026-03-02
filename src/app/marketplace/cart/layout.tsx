// Force dynamic rendering for cart routes
export const dynamic = 'force-dynamic';

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
