export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2 ${className}`}>
      <NailIcon className="h-7 w-7 text-orange" />
      <span className="font-display text-lg font-bold tracking-tight">
        <span className="text-foreground">Masmer</span>
        <span className="text-orange"> AI</span>
      </span>
    </a>
  );
}

function NailIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Nail head */}
      <ellipse cx="12" cy="4" rx="6" ry="1.6" fill="currentColor" stroke="none" />
      {/* Shaft */}
      <path d="M9 5.5 L12 22 L15 5.5" fill="currentColor" stroke="none" />
    </svg>
  );
}