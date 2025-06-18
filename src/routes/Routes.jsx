import React from 'react';
import Home from '../components/Home';
import Navbar from '../components/Navbar';
//auth
import Login from '../components/auth/Login';
import Logout from '../components/auth/Logout';
import AuthLayout from '../layouts/AuthLayout';
import { Routes, Route } from 'react-router-dom';

//redirects
import RedirectIfAuthenticated from '../authRedirect/RedirectIfAuth';
import RedirectIfNotAuthenticated from '../authRedirect/RedirectIfNotAuth';
import RedirectIfNoPerm from '../authRedirect/RedirectIfNoPerm';

//respondents
import RespondentsLayout from '../layouts/RespondentLayout';
import RespondentsIndex from '../components/respondents/RespondentsIndex';
import CreateRespondent from '../components/respondents/CreateRespondent';
import EditRespondent from '../components/respondents/EditRespondent';
import RespondentDetail from '../components/respondents/RespondentDetail';

//projects
import ProjectLayout from '../layouts/ProjectLayout';
import ProjectsIndex from '../components/projects/ProjectsIndex';
import ProjectDetail from '../components/projects/ProjectDetail';
import CreateProject from '../components/projects/CreateProject';
import EditProject from '../components/projects/EditProject';

//template manager
import BatchRecord from '../components/batchRecord/BatchRecord';

//organizations
import OrganizationsIndex from '../components/organizations/OrganizationsIndex';
import CreateOrganization from '../components/organizations/CreateOrganization';
import EditOrganization from '../components/organizations/EditOrganization';

//indicators
import IndicatorsIndex from '../components/indicators/IndicatorsIndex';
import CreateIndicator from '../components/indicators/CreateIndicator';
import EditIndicator from '../components/indicators/EditIndicator';
import IndicatorDetail from '../components/indicators/IndicatorDetail';

function Router() {
    return (
        <Routes>
        <Route
            path='/'
            element={
            <RedirectIfNotAuthenticated>
                <Navbar />
                <Home />
            </RedirectIfNotAuthenticated>
            }
        />

        <Route 
            path='/respondents' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={<RespondentsIndex />}/>
            <Route path=':id' element={<RespondentDetail />} />
            <Route path='new' element={<CreateRespondent />} />
            <Route path=':id/edit' element={<EditRespondent />} />
        </Route>
        
        <Route 
            path='/batch-record' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <BatchRecord />
                </RedirectIfNoPerm>
                }/>
        </Route>

        <Route 
            path='/projects' 
            element = {
                <RedirectIfNotAuthenticated>
                        <Navbar />
                        <ProjectLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={<ProjectsIndex />}/>
            <Route path=':id' element = {<ProjectDetail />} />
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin']}>
                    <CreateProject />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin']}>
                    <EditProject />
                </RedirectIfNoPerm>
            }/>

        </Route>

        <Route 
            path='/organizations' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <OrganizationsIndex />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <OrganizationsIndex />
                </RedirectIfNoPerm>
                }/>
            
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <CreateOrganization/>
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']} org={true}>
                    <EditOrganization />
                </RedirectIfNoPerm>
                }/>
        </Route>
        
        <Route 
            path='/indicators' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin']}>
                    <IndicatorsIndex />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id' element={
                <RedirectIfNoPerm level={['admin']}>
                    <IndicatorDetail />
                </RedirectIfNoPerm>
                }/>
            
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin']}>
                    <CreateIndicator/>
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin']}>
                    <EditIndicator />
                </RedirectIfNoPerm>
                }/>
        </Route>
        


        <Route path='/users' element={<AuthLayout />}>
            <Route
                index
                element={
                <RedirectIfNotAuthenticated>
                    <Login />
                </RedirectIfNotAuthenticated>
            }
            />
            <Route
                path='login'
                element={
                <RedirectIfAuthenticated>
                    <Login />
                </RedirectIfAuthenticated>
            }
            />
            <Route
                path='logout'
                element={
                <RedirectIfNotAuthenticated>
                    <Logout />
                </RedirectIfNotAuthenticated>
            }
            />
        </Route>
        </Routes>
    );
}

export default Router;