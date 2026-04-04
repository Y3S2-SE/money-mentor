import { useRef } from 'react';

const useSwipeTabs = (tabs, activeTab, setActiveTab, threshold = 50) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    // Only activate on actual touch devices, not desktop trackpads
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // Don't activate if touch originated inside a fixed/portal element (e.g. modal)
    if (e.target.closest('[data-no-swipe]')) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (Math.abs(deltaX) < threshold) return;

    const currentIndex = tabs.indexOf(activeTab);
    if (deltaX < 0 && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return { handleTouchStart, handleTouchEnd };
};

export default useSwipeTabs;