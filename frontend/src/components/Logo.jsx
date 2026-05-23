import React from 'react';
import { Link } from 'react-router-dom';

// ─── Size Presets ────────────────────────────────────────────────────────────
const SIZES = {
  sm:  { icon: 24, text: 16, gap: 8  },
  md:  { icon: 32, text: 20, gap: 12 },
  lg:  { icon: 40, text: 24, gap: 14 },
  xl:  { icon: 48, text: 28, gap: 16 },
};

// ─── SVG Shop Icon ───────────────────────────────────────────────────────────
const IconMark = ({ size, dark }) => {
  const dims = SIZES[size];
  const s = dims.icon;

  const containerBg = dark ? '#FFFFFF' : '#312E81';
  const iconFill    = dark ? '#312E81' : '#FFFFFF';

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      {/* Rounded-square container */}
      <rect x="0" y="0" width="48" height="48" rx="12" fill={containerBg} />

      {/* Roof — simple chevron / triangle */}
      <polygon points="7,18 24,6 41,18" fill={iconFill} />

      {/* Building body */}
      <rect x="12" y="18" width="24" height="17" rx="2" fill={iconFill} opacity="0.92" />

      {/* Door — arched top */}
      <path
        d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z"
        fill={containerBg}
      />
      {/* Door inner highlight */}
      <rect x="22.5" y="27" width="3" height="6" rx="1.5" fill={iconFill} opacity="0.30" />

      {/* Accent flowing line — warm terracotta wave at the bottom */}
      <path
        d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5"
        stroke="#E8835C"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

// ─── Wordmark ────────────────────────────────────────────────────────────────
const Wordmark = ({ size, dark }) => {
  const dims = SIZES[size];
  const textColor = dark ? '#FFFFFF' : '#1E293B';

  return (
    <span
      style={{
        fontSize: dims.text,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        color: textColor,
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      Duka<span style={{ color: '#E8835C' }}>Flow</span>
    </span>
  );
};

// ─── Logo Component ──────────────────────────────────────────────────────────

/**
 * DukaFlow Logo — pure SVG icon + wordmark.
 *
 * Props:
 *   variant   'full' | 'icon' | 'text'   (default 'full')
 *   size      'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   dark      boolean                     (default false — set true for dark backgrounds)
 *   asLink    boolean                     (default true — wraps in <Link to="/">)
 *   className string                      (additional wrapper classes)
 *
 * Hover effect is automatic when asLink is true:
 *   • Slight scale-up (1.03)
 *   • Shadow boost
 *   • Text brightens slightly
 */
const Logo = ({
  variant = 'full',
  size    = 'md',
  dark    = false,
  asLink  = true,
  className = '',
}) => {
  const dims = SIZES[size];

  const showIcon = variant === 'full' || variant === 'icon';
  const showText = variant === 'full' || variant === 'text';

  const inner = (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showIcon && showText ? dims.gap : 0,
        transition: 'transform 0.2s ease, filter 0.2s ease',
        cursor: asLink ? 'pointer' : undefined,
      }}
    >
      {showIcon && <IconMark size={size} dark={dark} />}
      {showText && <Wordmark size={size} dark={dark} />}
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link
      to="/"
      style={{
        textDecoration: 'none',
        display: 'inline-flex',
      }}
      className="group"
      aria-label="DukaFlow — Home"
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: showIcon && showText ? dims.gap : 0,
          transition: 'transform 0.2s ease, filter 0.2s ease',
        }}
        className="group-hover:scale-[1.03] group-hover:brightness-110 group-focus-visible:ring-2 group-focus-visible:ring-[#312E81] group-focus-visible:ring-offset-2 rounded-lg"
      >
        {showIcon && <IconMark size={size} dark={dark} />}
        {showText && <Wordmark size={size} dark={dark} />}
      </span>
    </Link>
  );
};

export default Logo;
