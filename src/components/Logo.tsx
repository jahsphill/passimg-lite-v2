/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  withBackground?: boolean;
}

export default function Logo({ className = '', size = '100%', withBackground = true }: LogoProps) {
  // Vibrant saturated neon green identical to the user's uploaded official image asset
  const neonGreen = '#1eff00';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      id="brand-official-logo"
    >
      {/* Background rounded rectangle - representing the dark launcher icon frame in the image */}
      {withBackground && (
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="25"
          fill="#000000"
          id="logo-bg-frame"
        />
      )}

      {/* Main Shield Layout - Neon Green thick container line */}
      <path
        d="M 50,18 L 76,26 L 76,50 C 76,68 62,80 50,86 C 38,80 24,68 24,50 L 24,26 Z"
        fill="none"
        stroke={neonGreen}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        id="logo-shield-border"
      />

      {/* Viewfinder white brackets centered inside the shield */}
      <g stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" id="logo-viewfinder">
        {/* Top-Left bracket */}
        <path d="M 38,45 L 38,38 L 45,38" />
        {/* Top-Right bracket */}
        <path d="M 55,38 L 62,38 L 62,45" />
        {/* Bottom-Left bracket */}
        <path d="M 38,55 L 38,62 L 45,62" />
        {/* Bottom-Right bracket */}
        <path d="M 55,62 L 62,62 L 62,55" />
      </g>

      {/* Verified circle checkmark badge (aligned to bottom-right shoulder) */}
      <g id="logo-check-badge">
        {/* Outer dark halo to cleanly cut through the shield lines */}
        <circle
          cx="72"
          cy="72"
          r="18"
          fill="#000000"
        />
        {/* Fill neon circle */}
        <circle
          cx="72"
          cy="72"
          r="15"
          fill={neonGreen}
        />
        {/* The solid dark tick mark inside the neon circle */}
        <path
          d="M 64.5,72 L 69.5,77 L 79.5,67"
          fill="none"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
