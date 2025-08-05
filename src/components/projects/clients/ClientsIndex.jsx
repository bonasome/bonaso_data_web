import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

import { useProjects } from "../../../contexts/ProjectsContext";
import fetchWithAuth from "../../../../services/fetchWithAuth";

import IndexViewWrapper from "../../reuseables/IndexView"
import Loading from "../../reuseables/loading/Loading";
import ComponentLoading from "../../reuseables/loading/ComponentLoading";
import CreateClient from "./CreateClientModal";

import styles from '../../../styles/indexView.module.css';

import { RiGovernmentFill } from "react-icons/ri";
import Messages from '../../reuseables/Messages';

//little card for each client obj
function ClientCard({ client, callback=null, callbackText }){
    const [expanded, setExpanded] = useState(false);
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <Link to={`/clients/${client.id}`} style={{display:'flex', width:"fit-content"}}><h2>{client.name}</h2></Link>
            {callback && <button type="button" onClick={() => callback(client)}>{callbackText}</button> }
            {expanded &&
                <div>
                    {client.full_name && <p>{client.full_name}</p>}
                </div>
            }
        </div>
    )
}

//index to display clients
export default function ClientsIndex({ callback=null, callbackText='Select a Client', blacklist=[] }){
    //context
    const { clients, setClients } = useProjects();

    //index helpers
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false); //contorl create modal

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
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch clients: ', err)
                
            }
            finally{
                setLoading(false)
            }
        }
        getClients();
    }, [search])

    const filteredClients = clients?.filter(c => !blacklist.includes(c.id));
    if(loading) return callback ? <ComponentLoading /> : <Loading />
    return(
        <div className={styles.index}>
            {!callback && <h1>Clients</h1>}
            {showClientModal && <CreateClient onCreate={(client) => {setClients(prev=> [...prev, client]); setShowClientModal(false)}} onCancel={() => setShowClientModal(false)} /> }
            <button onClick={() => setShowClientModal(true)}> <RiGovernmentFill /> Create New Client</button>
            <IndexViewWrapper entries={entries} page={page} onSearchChange={setSearch} onPageChange={setPage}>
                {filteredClients?.length > 0 ? 
                    filteredClients.map((c) => (
                        <ClientCard key={c.id} client={c} callback={callback ? callback : null} callbackText={callbackText}/>
                    )) :
                    <p>No clients yet!</p>
                }
            </IndexViewWrapper>
        </div>
    )
}