import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { UserProvider } from './hook/authContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <GoogleOAuthProvider clientId='1005622017132-od8o6vgodloqntbve3mba6anjn6v5v71.apps.googleusercontent.com'>
        <UserProvider>
            <App />
        </UserProvider>
    </GoogleOAuthProvider>
);