import { createContext, useContext, useState } from 'react';

const IndicatorsContext = createContext();

export const IndicatorsProvider = ({ children }) => {
    const [indicators, setIndicators] = useState([]);
    const [indicatorDetails, setIndicatorDetails] = useState([]);
    const [indicatorsMeta, setIndicatorsMeta] = useState({})
    return (
        <IndicatorsContext.Provider value={{ 
            indicators, setIndicators, 
            indicatorDetails,setIndicatorDetails, 
            indicatorsMeta, setIndicatorsMeta
        }}>
            {children}
        </IndicatorsContext.Provider>
    );
};

export const useIndicators = () => useContext(IndicatorsContext);