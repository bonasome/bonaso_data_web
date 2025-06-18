import { createContext, useContext, useState } from 'react';

const IndicatorsContext = createContext();

export const IndicatorsProvider = ({ children }) => {
    const [indicators, setIndicators] = useState([]);
    const [indicatorDetails, setIndicatorDetails] = useState([]);
    return (
        <IndicatorsContext.Provider value={{ 
            indicators, setIndicators, 
            indicatorDetails,setIndicatorDetails, 
        }}>
            {children}
        </IndicatorsContext.Provider>
    );
};

export const useIndicators = () => useContext(IndicatorsContext);