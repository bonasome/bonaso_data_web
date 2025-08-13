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

export default function ProjectDeadlineIndex({ project }){
    //context
    const { user } = useAuth();

    const [announcements, setAnnouncements] = useState([]);
    const [composing, setComposing] = useState(false);
    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    

    //load events
    useEffect(() => {
        const loadAnncs = async () => {
            try {
                const url = `/api/messages/announcements/?search=${search}&page=${page}&project=${project.id}`;
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
        loadAnncs();
    }, [page, search, project]);

    if(loading) return <ComponentLoading />
    return(
        <div className={styles.index}>
            <Messages errors={errors} />
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} >
                {!['client'].includes(user.role) && <ButtonHover callback={() => setComposing(true)} noHover={<GrAnnounce />} hover={'New Announcement'} />}
                {composing && <ComposeAnnouncementModal projectID={project.id} onUpdate={(data) => setAnnouncements(prev => [...prev, data])} onClose={() => setComposing(false)} />}
                {announcements?.length === 0 ? 
                    <p>No announcements match your criteria.</p> :
                    announcements?.map(d => (
                        <AnnouncementCard key={d.id} project={project.id} announcement={d}  onUpdate={() => setPage(1)}/>)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}