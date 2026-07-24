export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#rakshak-logo-grad)" />
      <path
        d="M20 9l9 3.4v7c0 6.4-3.9 11.2-9 12.6-5.1-1.4-9-6.2-9-12.6v-7l9-3.4z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="rakshak-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b3ffb" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
