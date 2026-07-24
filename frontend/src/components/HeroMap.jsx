// Purely decorative — a stylized dark map with glowing detection points,
// echoing the live map without needing real tiles/geolocation on the landing page.
export default function HeroMap() {
  const dots = [
    [90, 60], [160, 40], [210, 90], [140, 130], [70, 190],
    [230, 200], [300, 70], [340, 150], [260, 260], [180, 300],
    [90, 320], [320, 300], [380, 220],
  ];

  return (
    <svg viewBox="0 0 420 420" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="420" height="420" fill="#0e0e17" />

      <g stroke="#3a3a4a" strokeWidth="1.5" opacity="0.6" fill="none">
        <path d="M0 60 L420 20" />
        <path d="M0 140 L420 110" />
        <path d="M0 260 L420 230" />
        <path d="M0 360 L420 340" />
        <path d="M40 0 L10 420" />
        <path d="M140 0 L170 420" />
        <path d="M260 0 L230 420" />
        <path d="M360 0 L390 420" />
      </g>
      <path d="M0 200 Q150 120 220 220 T420 180" stroke="#54546a" strokeWidth="2.5" fill="none" opacity="0.8" />

      {dots.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="9" fill="#a855f7" opacity="0.25" />
          <circle cx={x} cy={y} r="4" fill="#c084fc" />
        </g>
      ))}
    </svg>
  );
}
