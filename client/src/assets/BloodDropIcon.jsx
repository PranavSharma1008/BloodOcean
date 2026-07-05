const BloodDropIcon = ({ className = '', size = 200, animated = false }) => (
  <svg
    width={size}
    height={size * 0.5}
    viewBox="0 0 200 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="bloodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Heartbeat line extending from left */}
    <path
      d="M0 50 L30 50 L35 50 L40 35 L45 65 L50 50 L55 50 L60 50"
      stroke="url(#bloodGradient)"
      strokeWidth="2.5"
      fill="none"
      className={animated ? 'animate-pulse' : ''}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Blood drop with subtle glow */}
    <path
      d="M100 10 C100 10 70 45 70 60 C70 75.5 82.5 85 100 85 C117.5 85 130 75.5 130 60 C130 45 100 10 100 10Z"
      fill="url(#bloodGradient)"
      filter="url(#glow)"
      className={animated ? 'animate-blood-drop' : ''}
    />

    {/* Highlight on drop */}
    <ellipse cx="95" cy="50" rx="8" ry="12" fill="white" opacity="0.2" />

    {/* Heartbeat line extending to right */}
    <path
      d="M140 50 L145 50 L150 50 L155 35 L160 65 L165 50 L170 50 L200 50"
      stroke="url(#bloodGradient)"
      strokeWidth="2.5"
      fill="none"
      className={animated ? 'animate-pulse' : ''}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default BloodDropIcon;
