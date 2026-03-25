import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Lottie from 'lottie-react';

const loadLottie = async (badgeKey) => {
    switch (badgeKey) {
        case 'first_login':
            return (await import('../../assets/lottie/rocket.json')).default;
        case 'read_5_articles':
            return (await import('../../assets/lottie/bookworm.json')).default;
        case 'first_saving_goal':
            return (await import('../../assets/lottie/saving_goal.json')).default;
        case 'first_investment':
            return (await import('../../assets/lottie/investment.json')).default;
        case 'milestone_level5':
            return (await import('../../assets/lottie/rising_star.json')).default;
        case 'milestone_super_saver':
            return (await import('../../assets/lottie/super_saver.json')).default;
        case 'milestone_budget_master':
            return (await import('../../assets/lottie/budget_master.json')).default;
        case 'milestone_1000xp':
            return (await import('../../assets/lottie/milestone_1000.json')).default; 
        case 'milestone_100xp':
            return (await import('../../assets/lottie/milestone_100.json')).default; 
        case 'streak_3_days':
            return (await import('../../assets/lottie/streak_3.json')).default;
        case 'streak_7_days':
            return (await import('../../assets/lottie/streak_7.json')).default;
        case 'streak_30_days':
            return (await import('../../assets/lottie/streak_30.json')).default;
        default:
            return (await import('../../assets/lottie/medal.json')).default;
    }
};

const LoadingPlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-100 border-t-blue-400 animate-spin" />
    </div>
);

const BadgeIcon = forwardRef(({ badgeKey, earned }, ref) => {
    const [animData, setAnimData] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef();
    const lottieRef = useRef();

    useImperativeHandle(ref, () => ({
        play: () => { if (earned) lottieRef.current?.play(); },
        pause: () => lottieRef.current?.pause(),
        reset: () => lottieRef.current?.goToAndStop(0, true),
    }), [earned]);

    // Step 1 — load for ALL badges (earned or not) once in viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);                         // ← no [earned] guard anymore

    // Step 2 — fetch JSON once visible (earned or not)
    useEffect(() => {
        if (!isVisible) return;
        loadLottie(badgeKey)
            .then(setAnimData)
            .catch((err) => {
                console.error(`[BadgeIcon] Failed to load lottie for "${badgeKey}":`, err);
                setHasError(true);
            });
    }, [isVisible, badgeKey]);

    // Step 3 — safety net: pause if scrolled out of view
    useEffect(() => {
        if (!animData) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (!entry.isIntersecting) lottieRef.current?.pause(); },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [animData]);

    return (
        <div ref={containerRef} className="w-full h-full">
            {hasError ? (
                <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-10 h-10">
                        <circle cx="32" cy="32" r="28" fill="#dbeafe" />
                        <path d="M32 20v16M32 42v2" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                </div>
            ) : animData ? (
                <Lottie
                    lottieRef={lottieRef}
                    animationData={animData}
                    loop={true}
                    autoplay={false}
                    style={{
                        width: '100%',
                        height: '100%',
                        // ← grayscale + dim when locked, full color when earned
                        filter: earned ? 'none' : 'grayscale(100%) opacity(0.35)',
                        transition: 'filter 0.3s ease',
                    }}
                />
            ) : (
                <LoadingPlaceholder />
            )}
        </div>
    );
});

BadgeIcon.displayName = 'BadgeIcon';
export default BadgeIcon;