import Home from '../components/Home';
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
import Respondents from '../components/respondents/Respondents';
import CreateRespondent from '../components/respondents/CreateRespondent';
import ViewRespondent from '../components/respondents/ViewRespondent';
import EditRespondent from '../components/respondents/EditRespondent';

//indicators 
import IndicatorsLayout from '../layouts/IndicatorsLayout';
import { IndicatorDetail } from '../components/indicators/Indicators';
import CreateIndicator from '../components/indicators/CreateIndicator'

//projects
import ProjectsLayout from '../layouts/ProjectsLayout';
import Projects from '../components/projects/Projects';
import CreateProject from '../components/projects/CreateProject';
import ViewProject from '../components/projects/ViewProject';

function Router() {
    return (
        <Routes>
        <Route
            path='/'
            element={
            <RedirectIfNotAuthenticated>
                <Home />
            </RedirectIfNotAuthenticated>
            }
        />

        <Route 
            path='/respondents' 
            element = {
                <RedirectIfNotAuthenticated>
                    <RespondentsLayout />
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={<Respondents />}/>
            <Route path='create' element={<CreateRespondent />} />
            <Route path=':id/edit' element={<EditRespondent />} />
        </Route>

        <Route 
            path='/indicators' 
            element = {
                <RedirectIfNotAuthenticated>
                    <RedirectIfNoPerm level={'admin'}>
                        <IndicatorsLayout />
                    </RedirectIfNoPerm>
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={<IndicatorDetail />}/>
            <Route path='create' element={<CreateIndicator />} />
        </Route>

        <Route 
            path='/projects' 
            element = {
                <RedirectIfNotAuthenticated>
                    <RedirectIfNoPerm level={'admin'}>
                        <ProjectsLayout />
                    </RedirectIfNoPerm>
                </RedirectIfNotAuthenticated>
            }
        >
            <Route index element={<Projects />}/>
            <Route path='create' element={<CreateProject />} />
            <Route path=':id/view' element={<ViewProject />} />
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