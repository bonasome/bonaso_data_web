import { createContext, useContext, useState } from 'react';

const OrganizationsContext = createContext();

export const OrganizationsProvider = ({ children }) => {
    //Context that stores some global variables about organizations
    const [organizations, setOrganizations] = useState([]); //used for index views
    const [organizationDetails, setOrganizationDetails] = useState([]); //used for detail views
    return (
        <OrganizationsContext.Provider value={{ 
            organizations, setOrganizations, 
            organizationDetails,setOrganizationDetails, 
        }}>
            {children}
        </OrganizationsContext.Provider>
    );
};

export const useOrganizations = () => useContext(OrganizationsContext);