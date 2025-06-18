import { createContext, useContext, useState } from 'react';

const OrganizationsContext = createContext();

export const OrganizationsProvider = ({ children }) => {
    const [organizations, setOrganizations] = useState([]);
    const [organizationDetails, setOrganizationDetails] = useState([]);
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