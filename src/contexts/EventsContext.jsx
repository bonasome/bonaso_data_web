import { createContext, useContext, useState } from 'react';

const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [eventDetails, setEventDetails] = useState([]);
    const [eventsMeta, setEventsMeta] = useState({})
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