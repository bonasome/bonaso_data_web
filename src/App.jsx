import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectsContext';
import { RespondentsProvider } from './contexts/RespondentsContext';
import { OrganizationsProvider } from './contexts/OrganizationsContext';
import { IndicatorsProvider } from './contexts/IndicatorsContext';
import { InteractionsProvider } from './contexts/InteractionsContext';
import { ProfilesProvider } from './contexts/ProfilesContext';
import Router from './routes/Routes';
import Navbar from './components/Navbar';
import { EventsProvider } from './contexts/EventsContext';
import { SocialPostsProvider } from './contexts/SocialPostsContext';

function App() {
    /*
    Central component that manages all routes. Place all context provider wrappers here.
    */
    return (
        <ProjectProvider>
        <RespondentsProvider>
        <OrganizationsProvider>
        <IndicatorsProvider>
        <InteractionsProvider>
        <ProfilesProvider>
        <EventsProvider >
        <SocialPostsProvider>
            <BrowserRouter>
                <Router />
            </BrowserRouter>
        </SocialPostsProvider>
        </EventsProvider>
        </ProfilesProvider>
        </InteractionsProvider>
        </IndicatorsProvider>
        </OrganizationsProvider>
        </RespondentsProvider>
        </ProjectProvider>
    );
}

export default App;