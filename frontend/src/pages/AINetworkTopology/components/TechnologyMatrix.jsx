/* TechnologyMatrix — bottom shared capabilities bar */

import { memo, useRef, useEffect } from 'react';
import { ECOSYSTEM_TECH_STACK } from '../constants/ecosystem';
import gsap from 'gsap';

const TechnologyMatrix = memo(function TechnologyMatrix({ T, isDark }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const cats = ref.current.querySelectorAll('.tech-cat');
    gsap.fromTo(cats, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out', delay: 0.2 });
  }, []);

  return (
    <div ref={ref} style={{
      display: 'flex', gap: 16, padding: '0 4px', overflow: 'auto',
    }}>
      {ECOSYSTEM_TECH_STACK.map(cat => (
        <div key={cat.category} className="tech-cat" style={{ minWidth: 110, flex: '0 0 auto' }}>
          <div style={{
            color: isDark ? '#c4b5fd' : '#6d28d9', fontSize: 8, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
          }}>{cat.category}</div>
          {cat.items.map(item => (
            <div key={item} style={{
              color: T.textPrimary, fontSize: 8.5, padding: '1.5px 0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.textMuted, flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export default TechnologyMatrix;
