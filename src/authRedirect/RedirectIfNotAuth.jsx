import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';
import Loading from '../components/reuseables/loading/Loading';

const RedirectIfNotAuthenticated = ({ children }) => {
    const { user, loading, loggedIn } = useAuth();

    if(loading) return <Loading />

    if (!loggedIn) {
        return <Navigate to="/users/login" replace />;
    }
    
    const allowedForViewOnly = ['/users/logout'];
    if (loggedIn && user?.role === 'view_only' && !allowedForViewOnly.includes(location.pathname)) {
        return <Navigate to="/viewer" replace />;
    }
    if (loggedIn && !user?.organization_id && !allowedForViewOnly.includes(location.pathname)) {
        return <Navigate to="/viewer" replace />;
    }


    return children;
};

export default RedirectIfNotAuthenticated;