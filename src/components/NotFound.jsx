// NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import bonasoWhite from '../assets/bonasoWhite.png';

export default function NotFound() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
            <img style={{height: '30vh'}} src={bonasoWhite} />
            <p>Sorry, this page does not exist. Double check the url that you entered. If you
                believe that this is a mistake, please contact a site administrator.
            </p>
            <Link to="/"><button>Take Me Home</button></Link>
        </div>
    );
}