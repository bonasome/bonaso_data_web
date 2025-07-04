import { createContext, useContext, useState } from 'react';

const InteractionsContext = createContext();

export const InteractionsProvider = ({ children }) => {
    const [interactions, setInteractions] = useState([]);

    return (
        <InteractionsContext.Provider value={{ interactions, setInteractions }}>
            {children}
        </InteractionsContext.Provider>
    );
};

export const useInteractions = () => useContext(InteractionsContext);