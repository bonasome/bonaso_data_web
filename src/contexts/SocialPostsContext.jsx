import { createContext, useContext, useState } from 'react';

const SocialPostsContext = createContext();

export const SocialPostsProvider = ({ children }) => {
    const [socialPosts, setSocialPosts] = useState([]);
    const [socialPostsMeta, setSocialPostsMeta] = useState({})
    return (
        <SocialPostsContext.Provider value={{ 
            socialPosts, setSocialPosts, 
            socialPostsMeta, setSocialPostsMeta
        }}>
            {children}
        </SocialPostsContext.Provider>
    );
};

export const useSocialPosts = () => useContext(SocialPostsContext);