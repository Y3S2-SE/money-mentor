import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4">
            <div className="text-center">
                <h1 className="text-8xl font-bold text-blue-600 mb-2">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
                <p className="text-gray-400 text-sm max-w-sm">
                    The page you're looking for doesn't exist or has been moved.
                </p>
            </div>
            <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default NotFound;