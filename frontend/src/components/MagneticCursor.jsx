import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Drop-in magnetic cursor.
 * Add  style={{ cursor: 'none' }}  to the page root element when using this.
 */
const MagneticCursor = () => {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const moveDotX  = gsap.quickTo(dot,  'x', { duration: 0.1, ease: 'none' });
    const moveDotY  = gsap.quickTo(dot,  'y', { duration: 0.1, ease: 'none' });
    const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' });
    const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });

    const onMove = (e) => {
      moveDotX(e.clientX);
      moveDotY(e.clientY);
      moveRingX(e.clientX);
      moveRingY(e.clientY);
    };

    const onEnterLink = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      gsap.to(ring, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: 56, height: 56, duration: 0.4, ease: 'power3.out' });
      gsap.to(dot,  { scale: 0, duration: 0.2 });
    };
    const onLeaveLink = () => {
      gsap.to(ring, { width: 32, height: 32, duration: 0.4, ease: 'back.out(2)' });
      gsap.to(dot,  { scale: 1, duration: 0.3 });
    };

    window.addEventListener('mousemove', onMove);
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', onEnterLink);
      el.addEventListener('mouseleave', onLeaveLink);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.querySelectorAll('a, button').forEach((el) => {
        el.removeEventListener('mouseenter', onEnterLink);
        el.removeEventListener('mouseleave', onLeaveLink);
      });
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 9999,
          width: 6, height: 6, borderRadius: '50%',
          background: 'white', pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'difference',
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 9998,
          width: 32, height: 32, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.6)',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
};

export default MagneticCursor;
