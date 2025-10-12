import React from 'react';
import Home from '../components/home/Home';
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

import ViewOnly from '../components/redirects/ViewOnly';
//respondents
import RespondentsLayout from '../layouts/RespondentLayout';
import RespondentsIndex from '../components/respondents/RespondentsIndex';
import RespondentForm from '../components/respondents/RespondentForm';
import RespondentDetail from '../components/respondents/RespondentDetail';

//projects
import ProjectLayout from '../layouts/ProjectLayout';
import ProjectsIndex from '../components/projects/ProjectsIndex';
import ProjectDetail from '../components/projects/ProjectDetail';
import ProjectOrganization from '../components/projects/ProjectOrganization';
import ProjectForm from '../components/projects/ProjectForm';

import NarrativeReportUpload from '../components/narrativeReports/NarrativeReportUpload';
import NarrativeReportDownload from '../components/narrativeReports/NarrativeReportDownload';

import ClientsIndex from '../components/projects/clients/ClientsIndex';
import ClientDetail from '../components/projects/clients/ClientsDetail';

//template manager
import BatchRecord from '../components/batchRecord/BatchRecord';

//organizations
import OrganizationsIndex from '../components/organizations/OrganizationsIndex';
import OrganizationDetail from '../components/organizations/OrganizationDetail';
import OrganizationForm from '../components/organizations/OrganizationForm';

//indicators
import IndicatorsIndex from '../components/indicators/IndicatorsIndex';
import IndicatorDetail from '../components/indicators/IndicatorDetail';
import IndicatorForm from '../components/indicators/IndicatorForm'
import AssessmentForm from '../components/indicators/assessment/AssessmentForm';

import Tutorial from '../components/tutorial/Tutorial';
import NotFound from '../components/redirects/NotFound';

import ProfileLayout from '../layouts/ProfileLayout';
import Profile from '../components/users/Profile';
import UsersIndex from '../components/users/UsersIndex';
import UserForm from '../components/users/UserForm';

import EventDetail from '../components/events/EventDetail';
import EventForm from '../components/events/EventForm';
import EventsIndex from '../components/events/EventsIndex';

import Dashboards from '../components/analytics/dashboards/Dashboards';
import PivotTables from '../components/analytics/pivotTables/PivotTables';
import LineLists from '../components/analytics/lineLists/LineLists';
import SiteAnalytics from '../components/analytics/siteAnalytics/SiteAnalytics';

import Messages from '../components//messages/Messages';
import ProjectActivityForm from '../components/projects/activities/ProjectActivityForm';
import ProjectDeadlineForm from '../components/projects/deadlines/ProjectDeadlineForm';
import TargetForm from '../components/projects/targets/TargetForm';

import SocialPostsIndex from '../components/social/SocialPostsIndex';
import SocialPostDetail from '../components/social/SocialPostDetail';
import SocialPostForm from '../components/social/SocialPostForm';

import FunWithFlags from '../components/flags/FunWithFlags';
import AssessmentsIndex from '../components/indicators/assessment/AssessmentsIndex';


function Router() {
    /*
    Stores information about all URL endpoints and manages page level permissions with Redirects (src/authRedirect)
    */
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
            <Route path='new' element={<RespondentForm />} />
            <Route path=':id/edit' element={<RespondentForm />} />
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
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <ProjectsIndex />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id' element = {
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <ProjectDetail />
                </RedirectIfNoPerm>
            } />
            <Route path=':id/organizations/:orgID' element = {
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <ProjectOrganization />
                </RedirectIfNoPerm>
            } />
            <Route path=':id/organizations/:orgID/targets/new' element = {
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <TargetForm />
                </RedirectIfNoPerm>
            } />
            <Route path=':id/organizations/:orgID/:targetID/edit' element = {
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <TargetForm />
                </RedirectIfNoPerm>
            } />
            <Route path=':id/organizations/:orgID/upload' element = {
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <NarrativeReportUpload />
                </RedirectIfNoPerm>
            } />
            <Route path=':id/activities/new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <ProjectActivityForm />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/activities/:activityID/edit' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <ProjectActivityForm />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/deadlines/new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <ProjectDeadlineForm />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/deadlines/:deadlineID/edit' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <ProjectDeadlineForm />
                </RedirectIfNoPerm>
            }/>
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin']}>
                    <ProjectForm />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin']}>
                    <ProjectForm />
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
                    <OrganizationForm />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']} org={true}>
                    <OrganizationForm />
                </RedirectIfNoPerm>
                }/>
        </Route>
        
        <Route 
            path='/flags' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <FunWithFlags />
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
                    <IndicatorForm />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin']}>
                    <IndicatorForm />
                </RedirectIfNoPerm>
                }/>
            <Route path='assessments' element={
                <RedirectIfNoPerm level={['admin']}>
                    <AssessmentsIndex />
                </RedirectIfNoPerm>
                }/>
            <Route path='assessments/new' element={
                <RedirectIfNoPerm level={['admin']}>
                    <AssessmentForm />
                </RedirectIfNoPerm>
                }/>
            <Route path='assessments/:id/edit' element={
                <RedirectIfNoPerm level={['admin']}>
                    <AssessmentForm />
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
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <UsersIndex />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id' element={
                    <Profile />
                }/>
            
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <UserForm />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                    <UserForm />
                }/>
        </Route>
        
        <Route 
            path='/social' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <SocialPostsIndex />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <SocialPostDetail />
                </RedirectIfNoPerm>
                }/>
            
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <SocialPostForm />
                </RedirectIfNoPerm>
                }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']} org={true}>
                    <SocialPostForm />
                </RedirectIfNoPerm>
                }/>
        </Route>


        <Route 
            path='/messages' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <ProfileLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <Messages />
            }/>
            <Route path=':id' element={
                <Messages />
            }/>
        </Route>

        <Route 
            path='/clients' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <ProjectLayout />
                </RedirectIfNotAuthenticated>
        }>
            <Route index element={
                <RedirectIfNoPerm level={['admin']}>
                    <ClientsIndex />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id' element={
                <RedirectIfNoPerm level={['admin']}>
                    <ClientDetail />
                </RedirectIfNoPerm>
            }/>
        </Route>
        
        <Route 
            path='/events' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <ProjectLayout />
                </RedirectIfNotAuthenticated>
        }>
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <EventsIndex />
                </RedirectIfNoPerm>
            }/>
            <Route path='new' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <EventForm />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager', 'client']}>
                    <EventDetail />
                </RedirectIfNoPerm>
            }/>
            <Route path=':id/edit' element={
                <RedirectIfNoPerm level={['admin', 'meofficer', 'manager']}>
                    <EventForm />
                </RedirectIfNoPerm>
            }/>
        </Route>
        
        <Route 
            path='/analytics' 
            element = {
                <RedirectIfNotAuthenticated>
                    <Navbar />
                    <ProfileLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={
                <RedirectIfNoPerm level={['admin', 'client',  'meofficer', 'manager']}>
                    <Dashboards />
                </RedirectIfNoPerm>
            }/>
            <Route path='tables' element={
                <RedirectIfNoPerm level={['admin', 'client',  'meofficer', 'manager']}>
                    <PivotTables />
                </RedirectIfNoPerm>
            }/>
            <Route path='lists' element={
                <RedirectIfNoPerm level={['admin', 'client',  'meofficer', 'manager']}>
                    <LineLists />
                </RedirectIfNoPerm>
            }/>
            <Route path='site' element={
                <RedirectIfNoPerm level={['admin']}>
                    <SiteAnalytics />
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