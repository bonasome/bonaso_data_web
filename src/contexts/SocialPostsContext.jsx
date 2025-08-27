import { createContext, useContext, useState } from 'react';

const SocialPostsContext = createContext();

export const SocialPostsProvider = ({ children }) => {
    //Context that stores some global variables about social posts
    const [socialPosts, setSocialPosts] = useState([]); //array of posts
    const [socialPostsMeta, setSocialPostsMeta] = useState({}); //the model meta
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