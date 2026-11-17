import React from "react";

export const BearMascot: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <circle cx="52" cy="48" r="24" fill="#E8C3A4" />
    <circle cx="52" cy="48" r="13" fill="#B58363" />
    <circle cx="148" cy="48" r="24" fill="#E8C3A4" />
    <circle cx="148" cy="48" r="13" fill="#B58363" />
    <ellipse cx="100" cy="76" rx="54" ry="46" fill="#E8C3A4" />
    <circle cx="80" cy="70" r="5" fill="#1C1C1E" />
    <circle cx="120" cy="70" r="5" fill="#1C1C1E" />
    <ellipse cx="100" cy="84" rx="16" ry="12" fill="#F6DFC9" />
    <path d="M94 80 C94 77 106 77 106 80 L100 88 Z" fill="#1C1C1E" />
    <ellipse cx="100" cy="148" rx="46" ry="44" fill="#E8C3A4" />
    <path
      d="M100 176 C100 176 62 152 62 128 C62 115 73 107 85 107 C93 107 98 112 100 117 C102 112 107 107 115 107 C127 107 138 115 138 128 C138 152 100 176 100 176 Z"
      fill="#EB4444"
    />
    <ellipse
      cx="62"
      cy="142"
      rx="14"
      ry="22"
      transform="rotate(-25 62 142)"
      fill="#F6DFC9"
    />
    <ellipse
      cx="138"
      cy="142"
      rx="14"
      ry="22"
      transform="rotate(25 138 142)"
      fill="#F6DFC9"
    />
  </svg>
);
