export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-['Fraunces',Georgia,serif] text-xl font-semibold tracking-tight ${className}`}>
      mind<span className="italic text-[#48AD9C]">nova</span>
    </span>
  )
}
