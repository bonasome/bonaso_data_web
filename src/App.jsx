import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectsContext';
import { RespondentsProvider } from './contexts/RespondentsContext';
import { OrganizationsProvider } from './contexts/OrganizationsContext';
import { IndicatorsProvider } from './contexts/IndicatorsContext';
import { InteractionsProvider } from './contexts/InteractionsContext';
import { TasksProvider } from './contexts/TasksContext';
import Router from './routes/Routes';
import Navbar from './components/Navbar';
function App() {
    return (
        <ProjectProvider>
        <RespondentsProvider>
        <OrganizationsProvider>
        <IndicatorsProvider>
        <InteractionsProvider>
        <TasksProvider>
            <BrowserRouter>
                <Router />
            </BrowserRouter>
        </TasksProvider>
        </InteractionsProvider>
        </IndicatorsProvider>
        </OrganizationsProvider>
        </RespondentsProvider>
        </ProjectProvider>
    );
}

export default App;