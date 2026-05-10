export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-gold text-background font-black text-xl shadow-gold">
        M
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        <span className="text-gold">Masmer</span>
        <span className="text-foreground"> AI</span>
      </span>
    </a>
  );
}