import React from 'react';
import Home from '../components/Home';
import Navbar from '../components/Navbar';
//auth
import Login from '../components/auth/Login';
import Logout from '../components/auth/Logout';
import EnterEmail from '../components/auth/passwordReset/EnterEmail';
import ResetForm from '../components/auth/passwordReset/ResetForm';

import AuthLayout from '../layouts/AuthLayout';
import { Routes, Route } from 'react-router-dom';
 

//redirects
import RedirectIfAuthenticated from '../authRedirect/RedirectIfAuth';
import RedirectIfNotAuthenticated from '../authRedirect/RedirectIfNotAuth';
import RedirectIfNoPerm from '../authRedirect/RedirectIfNoPerm';

import ViewOnly from '../components/ViewOnly';
//respondents
import RespondentsLayout from '../layouts/RespondentLayout';
import RespondentsIndex from '../components/respondents/RespondentsIndex';
import CreateRespondent from '../components/respondents/CreateRespondent';
import EditRespondent from '../components/respondents/EditRespondent';
import RespondentDetail from '../components/respondents/RespondentDetail';
import FlaggedInteractions from '../components/respondents/interactions/FlaggedInteractions';

//projects
import ProjectLayout from '../layouts/ProjectLayout';
import ProjectsIndex from '../components/projects/ProjectsIndex';
import ProjectDetail from '../components/projects/projectDetail/ProjectDetail';
import CreateProject from '../components/projects/CreateProject';
import EditProject from '../components/projects/EditProject';
import NarrativeReportUpload from '../components/narrativeReports/NarrativeReportUpload';
import NarrativeReportDownload from '../components/narrativeReports/NarrativeReportDownload';

//template manager
import BatchRecord from '../components/batchRecord/BatchRecord';

//organizations
import OrganizationsIndex from '../components/organizations/OrganizationsIndex';
import OrganizationDetail from '../components/organizations/OrganizationDetail';
import CreateOrganization from '../components/organizations/CreateOrganization';
import EditOrganization from '../components/organizations/EditOrganization';

//indicators
import IndicatorsIndex from '../components/indicators/IndicatorsIndex';
import CreateIndicator from '../components/indicators/CreateIndicator';
import EditIndicator from '../components/indicators/EditIndicator';
import IndicatorDetail from '../components/indicators/IndicatorDetail';

import Tutorial from '../components/tutorial/Tutorial';
import NotFound from '../components/NotFound';

import ProfileLayout from '../layouts/ProfileLayout';
import Profile from '../components/users/Profile';
import UsersIndex from '../components/users/UsersIndex';
import CreateUser from '../components/users/CreateUser';
import EditUser from '../components/users/EditUser';

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
            <Route path='flagged' element={<FlaggedInteractions />} />
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
            <Route path=':id' element = {
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <ProjectDetail />
                </RedirectIfNoPerm>
            } />
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
            <Route path=':id/narrative-reports/upload' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <NarrativeReportUpload />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/narrative-reports/download' element={
                <RedirectIfNoPerm level={['admin', 'client']}>
                    <NarrativeReportDownload />
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
                    <OrganizationDetail />
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

        <Route 
            path='/profiles' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <ProfileLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <UsersIndex />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id' element={
                    <Profile />
                }/>
            
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <CreateUser/>
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                    <EditUser />
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
        
        <Route 
            path='/help' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <ProfileLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                    <Tutorial />
                }/>
        </Route>



        <Route
            path='/viewer'
            element={
                <ViewOnly />
            }
        />

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
                path='reset-password-get'
                element={
                <RedirectIfAuthenticated>
                    <EnterEmail />
                </RedirectIfAuthenticated>
            }
            />
            <Route
                path='reset-password-confirm/:uid/:token'
                element={
                <RedirectIfAuthenticated>
                    <ResetForm />
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
        <Route 
            path='*' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <NotFound />
                </RedirectIfNotAuthenticated>
            }
        >
        </Route>
        </Routes>
    );
}

export default Router;