import { createContext, useContext, useState } from 'react';

const ProfilesContext = createContext();

export const ProfilesProvider = ({ children }) => {
    //Context that stores some global variables about users/profiles
    const [profiles, setProfiles] = useState([]); //array of profiles
    const [profilesMeta, setProfilesMeta] = useState({}); //stores the model meta
    return (
        <ProfilesContext.Provider value={{ 
            profiles, setProfiles, 
            profilesMeta, setProfilesMeta,
        }}>
            {children}
        </ProfilesContext.Provider>
    );
};

export const useProfiles = () => useContext(ProfilesContext);