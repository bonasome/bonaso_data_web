import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';

const RedirectIfNoPerm = ({ children, level='admin' }) => {
    const { loading, loggedIn, user } = useAuth();
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!loggedIn || !user) {
        return <Navigate to="/users/login" replace />;
    }
    if(user.role != level){
        return <Navigate to='/' replace />
    }

    return children;
};

export default RedirectIfNoPerm;