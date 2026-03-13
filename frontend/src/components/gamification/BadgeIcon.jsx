import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Lottie from 'lottie-react';

const loadLottie = async (badgeKey) => {
    switch (badgeKey) {
        case 'first_login':
            return (await import('../../assets/lottie/rocket.json')).default;
        case 'first_saving_goal':
            return (await import('../../assets/lottie/target.json')).default;
        case 'read_5_articles':
            return (await import('../../assets/lottie/bookworm.json')).default;
        default:
            return (await import('../../assets/lottie/medal.json')).default;
    }
};

const LockedPlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="w-18 h-18">
            <rect x="12" y="28" width="40" height="28" rx="6" fill="#dbeafe" />
            <path d="M20 28V20a12 12 0 0124 0v8" fill="none" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="42" r="4" fill="#93c5fd" />
        </svg>
    </div>
);

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
        play:  () => lottieRef.current?.play(),
        pause: () => lottieRef.current?.pause(),
        reset: () => lottieRef.current?.goToAndStop(0, true),
    }), []);

    useEffect(() => {
        if (!earned) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [earned]);

    useEffect(() => {
        if (!isVisible || !earned) return;
        loadLottie(badgeKey)
            .then(setAnimData)
            .catch(() => setHasError(true));
    }, [isVisible, badgeKey, earned]);

    useEffect(() => {
        if (!earned || !animData) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (!entry.isIntersecting) lottieRef.current?.pause(); },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [earned, animData]);


    return (
        <div ref={containerRef} className="w-full h-full">
            {!earned ? (
                <LockedPlaceholder />
            ) : hasError ? (
                <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-10 h-10">
                        <circle cx="32" cy="32" r="28" fill="#dbeafe" />
                        <path d="M32 20v16M32 42v2" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                </div>
            ) : animData ? (
                <Lottie lottieRef={lottieRef} animationData={animData} loop={true} autoplay={false} style={{ width: '100%', height: '100%' }} />
            ) : (
                <LoadingPlaceholder />
            )}
        </div>
    );
});

BadgeIcon.displayName = 'BadgeIcon';
export default BadgeIcon;