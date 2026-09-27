import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
    const { user, token } = useSelector((state) => state.auth);

    return user && token ? children : <Navigate to="/auth" replace />;
};

export default PrivateRoute;
