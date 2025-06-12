import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UserAuth } from './contexts/UserAuth.jsx'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import Router from './routes/Routes.jsx'


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <UserAuth>
            <App />
        </UserAuth>
    </StrictMode>,
)
