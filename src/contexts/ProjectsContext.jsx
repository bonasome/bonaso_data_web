import { createContext, useContext, useState } from 'react';

const ProjectsContext = createContext();

export const ProjectProvider = ({ children }) => {
    //Context that stores some global variables about projects
    const [projects, setProjects] = useState([]); //used for index views
    const [projectDetails, setProjectDetails] = useState([]); //used for detail views
    const [projectsMeta, setProjectsMeta] = useState({}); //stores the model meta
    const [clients, setClients] = useState([]); //stores related information about clients
    const [tasks, setTasks] = useState({}); //stores related information about tasks

    return (
        <ProjectsContext.Provider value={{ projects, setProjects, 
            projectDetails, setProjectDetails, 
            projectsMeta, setProjectsMeta,
            clients, setClients,
            tasks, setTasks 
        }}>
            {children}
        </ProjectsContext.Provider>
    );
};

export const useProjects = () => useContext(ProjectsContext);