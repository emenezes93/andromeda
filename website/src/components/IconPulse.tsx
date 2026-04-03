export function IconPulse({
  size = 32,
  className = '',
  ...rest
}: { size?: number; className?: string } & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
      {...rest}
    >
      <defs>
        <linearGradient id="icon-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary-hover)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#icon-bg)" />
      <path
        d="M5 18h3v-4h2v8h2V12h2v6h2v-4h3v6h2"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
