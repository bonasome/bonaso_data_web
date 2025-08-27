import { createContext, useContext, useState } from 'react';

const RespondentsContext = createContext();

export const RespondentsProvider = ({ children }) => {
    //Context that stores some global variables about respondents
    const [respondents, setRespondents] = useState([]); //used for index views
    const [respondentDetails, setRespondentDetails] = useState([]); //used for detail views
    const [respondentsMeta, setRespondentsMeta] = useState([]); //stores model meta
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