import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/UserAuth';

const RedirectIfAuthenticated = ({ children }) => {
    const { loggedIn } = useAuth();
    return loggedIn ? <Navigate to="/" replace /> : children;
};

export default RedirectIfAuthenticated;