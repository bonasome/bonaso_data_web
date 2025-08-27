import { createContext, useContext, useState } from 'react';

const InteractionsContext = createContext();

export const InteractionsProvider = ({ children }) => {
    //Context that stores some global variables about interactions
    const [interactions, setInteractions] = useState([]); //array of interactions

    return (
        <InteractionsContext.Provider value={{ interactions, setInteractions }}>
            {children}
        </InteractionsContext.Provider>
    );
};

export const useInteractions = () => useContext(InteractionsContext);