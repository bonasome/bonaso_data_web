import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';
import Loading from '../components/reuseables/loading/Loading';

const RedirectIfAuthenticated = ({ children }) => {
    /*
    Wrapper that redirects a user away from the login screen when they are logged in.
    */
    const { loggedIn, loading } = useAuth();

    if (loading) return <Loading />

    // if logged in and auth check is done, redirect
    if (loggedIn) return <Navigate to="/" replace />;

    // otherwise, show the children (unauthenticated routes)
    return children;
};

export default RedirectIfAuthenticated;