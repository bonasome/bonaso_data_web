import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectsContext';
import { RespondentsProvider } from './contexts/RespondentsContext';
import { OrganizationsProvider } from './contexts/OrganizationsContext';
import { IndicatorsProvider } from './contexts/IndicatorsContext';
import { InteractionsProvider } from './contexts/InteractionsContext';
import { TasksProvider } from './contexts/TasksContext';
import { ProfilesProvider } from './contexts/ProfilesContext';
import Router from './routes/Routes';
import Navbar from './components/Navbar';
import { EventsProvider } from './contexts/EventsContext';
import { SocialPostsProvider } from './contexts/SocialPostsContext';
function App() {
    return (
        <ProjectProvider>
        <RespondentsProvider>
        <OrganizationsProvider>
        <IndicatorsProvider>
        <InteractionsProvider>
        <TasksProvider>
        <ProfilesProvider>
        <EventsProvider >
        <SocialPostsProvider>
            <BrowserRouter>
                <Router />
            </BrowserRouter>
        </SocialPostsProvider>
        </EventsProvider>
        </ProfilesProvider>
        </TasksProvider>
        </InteractionsProvider>
        </IndicatorsProvider>
        </OrganizationsProvider>
        </RespondentsProvider>
        </ProjectProvider>
    );
}

export default App;