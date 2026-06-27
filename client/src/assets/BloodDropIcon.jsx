const BloodDropIcon = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Heartbeat line extending from left */}
    <path d="M0 50 L30 50 L35 50 L40 35 L45 65 L50 50 L55 50 L60 50" stroke="#DC2626" strokeWidth="2" fill="none"/>
    
    {/* Blood drop */}
    <path d="M100 10 C100 10 70 45 70 60 C70 75.5 82.5 85 100 85 C117.5 85 130 75.5 130 60 C130 45 100 10 100 10Z" fill="#DC2626"/>
    
    {/* Heartbeat line extending to right */}
    <path d="M140 50 L145 50 L150 50 L155 35 L160 65 L165 50 L170 50 L200 50" stroke="#DC2626" strokeWidth="2" fill="none"/>
  </svg>
);

export default BloodDropIcon;
