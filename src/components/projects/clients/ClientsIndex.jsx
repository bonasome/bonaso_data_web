import IndexViewWrapper from "../../reuseables/IndexView"
import { useProjects } from "../../../contexts/ProjectsContext";
import styles from '../../../styles/indexView.module.css';
import fetchWithAuth from "../../../../services/fetchWithAuth";
import Loading from "../../reuseables/Loading";
import { useState, useEffect } from 'react';
import CreateClient from "./CreateClientModal";
import { Link } from "react-router-dom";
function ClientCard({ client }){
    const [expanded, setExpanded] = useState(false);
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <Link to={`/clients/${client.id}`} style={{display:'flex', width:"fit-content"}}><h2>{client.name}</h2></Link>
            {expanded &&
                <div>
                    {client.full_name && <p>{client.full_name}</p>}
                </div>
            }
        </div>
    )
}

export default function ClientsIndex(){
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { clients, setClients } = useProjects();
    const [showClientModal, setShowClientModal] = useState(false);

    useEffect(() => {
        const getClients = async () => {
            try {
                const url = `/api/manage/clients/?search=${search}&page=${page}`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                if (page === 1) {
                    setClients(data.results);
                } 
                else {
                    setClients((prev) => [...prev, ...data.results]);
                }
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        }
        getClients();
    }, [search])

    console.log(clients)
    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>Clients</h1>
            {showClientModal && <CreateClient onCreate={(client) => {setClients(prev=> [...prev, client]); setShowClientModal(false)}} onCancel={() => setShowClientModal(false)} /> }
            <button onClick={() => setShowClientModal(true)}>Create New Client</button>
            <IndexViewWrapper entries={entries} onSearchChange={setSearch} onPageChange={setPage}>
                {clients?.length > 0 ? 
                    clients.map((c) => (
                        <ClientCard key={c.id} client={c} />
                    )) :
                    <p>No clients yet!</p>
                }
            </IndexViewWrapper>
        </div>
    )
}