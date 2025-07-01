import { createContext, useContext, useState } from 'react';

const ProfilesContext = createContext();

export const ProfilesProvider = ({ children }) => {
    const [profiles, setProfiles] = useState([]);
    const [profileDetails, setProfileDetails] = useState([]);
    const [profilesMeta, setProfilesMeta] = useState({});
    return (
        <ProfilesContext.Provider value={{ 
            profiles, setProfiles, 
            profileDetails, setProfileDetails, 
            profilesMeta, setProfilesMeta,
        }}>
            {children}
        </ProfilesContext.Provider>
    );
};

export const useProfiles = () => useContext(ProfilesContext);