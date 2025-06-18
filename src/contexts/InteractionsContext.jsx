import { createContext, useContext, useState } from 'react';

const InteractionsContext = createContext();

export const InteractionsProvider = ({ children }) => {
    const [interactions, setInteractions] = useState([]);
    const [interactionDetails, setInteractionDetails] = useState([]);
    return (
        <InteractionsContext.Provider value={{ interactions, setInteractions, 
                        interactionDetails, setInteractionDetails }}>
            {children}
        </InteractionsContext.Provider>
    );
};

export const useInteractions = () => useContext(InteractionsContext);