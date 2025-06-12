import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';

const RedirectIfNotAuthenticated = ({ children }) => {
    const { loading, loggedIn } = useAuth();
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!loggedIn) {
        return <Navigate to="/users/login" replace />;
    }

    return children;
};

export default RedirectIfNotAuthenticated;