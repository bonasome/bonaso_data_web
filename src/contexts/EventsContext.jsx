import { createContext, useContext, useState } from 'react';

const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
    //Context that stores some global variables about events
    const [events, setEvents] = useState([]); //used for index views
    const [eventDetails, setEventDetails] = useState([]); //used for detail views
    const [eventsMeta, setEventsMeta] = useState({}); //stores the model meta
    return (
        <EventsContext.Provider value={{ 
            events, setEvents, 
            eventDetails,setEventDetails, 
            eventsMeta, setEventsMeta
        }}>
            {children}
        </EventsContext.Provider>
    );
};

export const useEvents = () => useContext(EventsContext);