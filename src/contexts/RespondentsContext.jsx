import { createContext, useContext, useState } from 'react';

const RespondentsContext = createContext();

export const RespondentsProvider = ({ children }) => {
    const [respondents, setRespondents] = useState([]);
    const [respondentDetails, setRespondentDetails] = useState([]);
    const [respondentsMeta, setRespondentsMeta] = useState([]);
    return (
        <RespondentsContext.Provider value={{ respondents, setRespondents, 
                        respondentDetails, setRespondentDetails, 
                        respondentsMeta, setRespondentsMeta,
                        }}>
            {children}
        </RespondentsContext.Provider>
    );
};

export const useRespondents = () => useContext(RespondentsContext);