import { createContext, useContext, useState } from 'react';

const IndicatorsContext = createContext();

export const IndicatorsProvider = ({ children }) => {
    //Context that stores some global variables about indicators
    const [indicators, setIndicators] = useState([]); //information for the index view
    const [indicatorDetails, setIndicatorDetails] = useState([]); //information for the detail view
    const [indicatorsMeta, setIndicatorsMeta] = useState({}); //information about the meta
    const [assessments, setAssessments] = useState([]);
    const [assessmentDetails, setAssessmentDetails] = useState([]);
    return (
        <IndicatorsContext.Provider value={{ 
            indicators, setIndicators, 
            indicatorDetails,setIndicatorDetails, 
            indicatorsMeta, setIndicatorsMeta,
            assessments, setAssessments,
            assessmentDetails, setAssessmentDetails,
        }}>
            {children}
        </IndicatorsContext.Provider>
    );
};

export const useIndicators = () => useContext(IndicatorsContext);