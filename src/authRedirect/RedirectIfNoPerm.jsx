import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';
import Loading from '../components/reuseables/loading/ComponentLoading';

const RedirectIfNoPerm = ({ children, level=['admin'] }) => {
    /*
    Wrapper that accepts an array of role names that should be allowed to access this page.
    Can be used when constructing routes.
    */
    const { loading, loggedIn, user } = useAuth();
    if(loading) return <Loading />
    
    //if they're not logged in for some reason, redirect to login (though RedirectIfNotAuth should handle this)
    if (!loggedIn || !user) {
        return <Navigate to="/users/login" replace />;
    }
    //if they are logged in, redirect them to the home page
    if(!level.includes(user.role)){
        return <Navigate to='/' replace />
    }

    return children;
};

export default RedirectIfNoPerm;