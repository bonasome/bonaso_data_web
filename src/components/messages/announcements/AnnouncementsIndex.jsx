import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Messages from '../../reuseables/Messages';
import IndexViewWrapper from '../../reuseables/IndexView';
import AnnouncementCard from './AnnouncementCard';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import ComposeAnnouncementModal from './ComposeAnnouncementModal';

import styles from '../../../styles/indexView.module.css';

import { GrAnnounce } from "react-icons/gr";

export default function AnnouncementsIndex({ project=null }){
    /*
    Index component that displays a list of a user's announcements. 
    - project (object, optional): allows the index to be scoped to a specific project
    */
    //context
    const { user } = useAuth();

    const [announcements, setAnnouncements] = useState([]);

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    //page meta
    const [composing, setComposing] = useState(false); //controls state for creating a new announcement
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    

    //load announcements
    const loadAnncs = async () => {
        try {
            const projectParam = project ? `&project=${project.id}` : '';
            const url = `/api/messages/announcements/?search=${search}&page=${page}` + projectParam;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            setEntries(data.count);
            setAnnouncements(data.results);
            setLoading(false);
        } 
        catch (err) {
            setErrors(['Something went wrong, Please try again later.']);
            console.error('Failed to fetch events: ', err);
            setLoading(false);
        }
    };
    //load on initialize or page/search change
    useEffect(() => {
        const fetchPage = async() => {
            await loadAnncs();
        }
        fetchPage();
    }, [page, search, project]);

    if(loading) return <ComponentLoading />
    return(
        <div className={styles.index}>
            <Messages errors={errors} />
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} >
                {!['client'].includes(user.role) && <button onClick={() => setComposing(true)}><GrAnnounce /> New Announcement</button>}
                {composing && <ComposeAnnouncementModal projectID={project.id} onUpdate={(data) => setAnnouncements(prev => [...prev, data])} onClose={() => setComposing(false)} />}
                {announcements?.length === 0 ? 
                    <p>No announcements match your criteria.</p> :
                    announcements?.map(annc => (
                        <AnnouncementCard key={annc.id} project={project.id} announcement={annc}  onUpdate={loadAnncs}/>)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}