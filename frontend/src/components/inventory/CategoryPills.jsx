import { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * CategoryPills — responsive horizontal category filter bar.
 *
 * Mobile (<640px):  horizontal scroll, hidden scrollbar, fade edges, 44px touch target
 * Tablet (640-1023px): same as mobile but larger text, no-scroll if all fit
 * Desktop (≥1024px): wrap to next row, no horizontal scroll, larger pills
 */

/* ── Responsive pill sizing ── */
const getPillStyle = () => {
  if (typeof window === 'undefined') return { padding: '10px 22px', fontSize: '15px', gap: '10px' };
  const w = window.innerWidth;
  if (w < 640) return { padding: '10px 18px', fontSize: '14px', gap: '8px' };
  if (w < 1024) return { padding: '10px 20px', fontSize: '15px', gap: '10px' };
  return { padding: '10px 22px', fontSize: '15px', gap: '10px' };
};

export default function CategoryPills({
  categories = [],        // [{ name: 'Trousers', count: 12 }, ...]
  total = 0,             // total product count for "All" pill
  selected = 'all',       // currently selected category name or 'all'
  onSelect,               // (categoryName: string) => void
  className = '',
}) {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [sizing, setSizing] = useState(getPillStyle);

  // Update sizing on resize
  useEffect(() => {
    const update = () => setSizing(getPillStyle());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Check scroll overflow for fade edges
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkOverflow, { passive: true });
    window.addEventListener('resize', checkOverflow);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [checkOverflow, categories]);

  // Scroll active pill into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activePill = el.querySelector('[data-active="true"]');
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  const handleSelect = (name) => {
    onSelect?.(name);
  };

  const clearFilter = () => {
    onSelect?.('all');
  };

  const isActive = selected !== 'all';

  return (
    <div className={`bg-white ${className}`}>
      {/* ── Pill container ── */}
      <div className="relative px-4 sm:px-5 lg:px-0" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
        {/* Left fade */}
        {showLeftFade && (
          <div
            className="absolute left-4 sm:left-5 lg:left-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{ width: '28px', background: 'linear-gradient(to right, white 0%, transparent 100%)' }}
          />
        )}
        {/* Right fade */}
        {showRightFade && (
          <div
            className="absolute right-4 sm:right-5 lg:right-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{ width: '28px', background: 'linear-gradient(to left, white 0%, transparent 100%)' }}
          />
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex lg:flex-wrap overflow-x-auto lg:overflow-visible scrollbar-none"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            gap: sizing.gap,
          }}
        >
          {/* "All" pill */}
          <button
            data-active={selected === 'all'}
            onClick={() => handleSelect('all')}
            className="inline-flex items-center flex-shrink-0 rounded-full font-medium whitespace-nowrap cursor-pointer transition-all duration-150"
            style={{
              padding: sizing.padding,
              fontSize: sizing.fontSize,
              minHeight: '44px',
              background: selected === 'all' ? '#312E81' : '#FFFFFF',
              color: selected === 'all' ? '#FFFFFF' : '#334155',
              border: selected === 'all' ? '1.5px solid #312E81' : '1.5px solid #CBD5E1',
              fontWeight: selected === 'all' ? 600 : 500,
              boxShadow: selected === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (selected !== 'all') {
                e.currentTarget.style.borderColor = '#6366F1';
                e.currentTarget.style.background = '#EEF2FF';
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== 'all') {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.background = '#FFFFFF';
              }
            }}
          >
            All{total > 0 ? ` (${total})` : ''}
          </button>

          {/* Category pills */}
          {categories.map((cat) => {
            const name = cat.name || cat;
            const count = typeof cat === 'object' ? cat.count : undefined;
            const isSel = selected === name;

            return (
              <button
                key={name}
                data-active={isSel}
                onClick={() => handleSelect(name)}
                className="inline-flex items-center flex-shrink-0 rounded-full font-medium whitespace-nowrap cursor-pointer transition-all duration-150"
                style={{
                  padding: sizing.padding,
                  fontSize: sizing.fontSize,
                  minHeight: '44px',
                  background: isSel ? '#312E81' : '#FFFFFF',
                  color: isSel ? '#FFFFFF' : '#334155',
                  border: isSel ? '1.5px solid #312E81' : '1.5px solid #CBD5E1',
                  fontWeight: isSel ? 600 : 500,
                  boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSel) {
                    e.currentTarget.style.borderColor = '#6366F1';
                    e.currentTarget.style.background = '#EEF2FF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSel) {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.background = '#FFFFFF';
                  }
                }}
              >
                {name}
                {count !== undefined && (
                  <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '4px' }}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active filter display ── */}
      {isActive && (
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 lg:px-0 pb-3">
          <span className="text-xs font-medium text-[#312E81]">Active Filter:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] border border-[#312E81]/10 rounded-full text-[13px] font-medium text-[#312E81]">
            {selected}
            <button
              onClick={clearFilter}
              className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#312E81]/10 transition-colors"
              aria-label={`Clear ${selected} filter`}
            >
              <X size={12} />
            </button>
          </span>
          <button
            onClick={clearFilter}
            className="ml-auto text-[13px] font-medium text-neutral-500 hover:text-[#312E81] transition-colors"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}
