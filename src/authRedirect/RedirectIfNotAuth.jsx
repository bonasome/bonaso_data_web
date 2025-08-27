import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';
import Loading from '../components/reuseables/loading/Loading';

const RedirectIfNotAuthenticated = ({ children }) => {
    /*
    Wrapper that redirects the user 
    */
    const location = useLocation();
    const { user, loading, loggedIn } = useAuth();

    if(loading) return <Loading />

    //if not logged in (and the auth state is not currently loading), redirect to the login page
    if (!loggedIn && !loading) {
        return <Navigate to="/users/login" replace />;
    }
    
    //if the user has the view only route, redirect them to the viewer page (unless they are logging out)
    const allowedForViewOnly = ['/users/logout'];
    if (loggedIn && user?.role === 'view_only' && !allowedForViewOnly.includes(location.pathname)) {
        return <Navigate to="/viewer" replace />;
    }
    //similarly, if a user has no organization or client organization, redirect them to the viewer page
    //every user should have an org, asnot having an org will break most pages
    if (loggedIn && !user?.organization_id && !user?.client_organization_id && !allowedForViewOnly.includes(location.pathname)) {
        return <Navigate to="/viewer" replace />;
    }


    return children;
};

export default RedirectIfNotAuthenticated;