export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#151124]/10 bg-white shadow-[0_16px_44px_rgba(30,21,56,0.06)] ${className}`}>{children}</section>;
}