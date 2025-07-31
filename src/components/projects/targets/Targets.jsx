import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import { tryMatchDates, getMonthDatesStr, getQuarterDatesStr, getWindowsBetween } from '../../../../services/dateHelpers';
import prettyDates from '../../../../services/prettyDates';

import IndexViewWrapper from '../../reuseables/IndexView';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import Messages from '../../reuseables/Messages';
import { EditTargetModal } from './EditTargetModal';

import styles from './targets.module.css';

import { PiTargetBold } from "react-icons/pi";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";

export function TargetCard({ target, project, organization, onUpdate, onCancel }){
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [del, setDel] = useState(false);
    const [expanded, setExpanded] = useState(false);


    const deleteTarget = async() => {
        try {
            console.log('deleting targets...');
            const response = await fetchWithAuth(`/api/manage/targets/${existing.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onUpdate();
                setErrors([]);
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } 
                catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete target:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false);
        }
    }

    const hasPerm = useMemo(() => {
        if(user.organization_id == organization?.parent?.id || user.role == 'admin') return true
        return false
    }, [organization, user]);
    console.log(target)
    if(!target || !project || !organization) return <ComponentLoading />
    if(editing) return <EditTargetModal existing={target} project={project} organization={organization} onCancel={() => setEditing(false)} onUpdate={() => onUpdate()}/>
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            {del && <ConfirmDelete name='Target' onConfirm={() => deleteTarget()} onCancel={() => setDel(false)} />}
           
            <div onClick={() => setExpanded(!expanded)}>
                <h3>Target for {target.task.display_name}</h3>
                {expanded && <div>

                    <p>{(prettyDates(target?.start))} to {prettyDates(target?.end)}</p>
                    {target.amount && <p>
                        Achievement: {target.achievement || 0} of {target.amount} 
                        ({target.amount != 0 ? Math.round((target.achievement/target.amount)*100) : '0'}%)
                    </p>}

                    {target.related_to && <p>
                        {target.percentage_of_related}% of 
                        {' ' + target.related_to?.display_name} ({target.achievement} of
                        {' ' + target.related_as_number + ' - '}
                        {target.related_as_number !== 0 ? Math.round((target.achievement/target.related_as_number)*100) : '0'}%)
                    </p>}
                    
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {hasPerm && !editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit'} />}
                        {hasPerm && !editing && !del && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Target'} forDelete={true} />}
                    </div>

                </div>}
        </div>
    </div>
    )
}



export default function Targets({ project, organization}) {
    const { id, orgID } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [adding, setAdding] =useState(false);
    const [targets, setTargets] = useState([]);

    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState(0);

    useEffect(() => {
        const getTargets = async () => {
            if(!id || !orgID) return;
            setLoading(true);
            try {
                console.log('fetching targets...');
                const response = await fetchWithAuth(`/api/manage/targets/?task__organization=${orgID}&task__project=${id}`);
                const data = await response.json();
                if(response.ok){
                    setEntries(data.count);
                    setTargets(data.results);
                    setLoading(false);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                setErrors(['Failed to fetch targets. Please try again later.'])
                console.error('Failed to fetch organization: ', err);
                setLoading(false)
            }
        }
        getTargets();
    }, [id, orgID])

    const handleChange = async () => {
        const getTargets = async () => {
            if(!id || !orgID) return;
            try {
                console.log('fetching targets...');
                const response = await fetchWithAuth(`/api/manage/targets/?task__organization=${orgID}&task__project=${id}`);
                const data = await response.json();
                if(response.ok){
                    setEntries(data.count);
                    setTargets(data.results);
                    setAdding(false);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                setErrors(['Failed to fetch targets. Please try again later.'])
                console.error('Failed to fetch organization: ', err);
            }
        }
        getTargets();
    }
    const hasPerm = useMemo(() => {
        if(!user || !organization) return false;
        if(user.organization_id == organization?.parent?.id || user.role == 'admin') return true
        return false
    }, [organization, user]);
    
    if (loading) return <ComponentLoading />
    return (
        <div>
            {hasPerm && <ButtonHover callback={() => setAdding(true)} noHover={<PiTargetBold />} hover={'New Target'} />}
            {adding && <EditTargetModal onUpdate={handleChange} onCancel={() => setAdding(false)} project={project} organization={organization} />}
            <IndexViewWrapper entries={entries} onSearchChange={setSearch} page={page} onPageChange={setPage}>
                {(targets && project && organization && targets?.length) == 0 ? 
                    <p>No targets yet. Make one!</p> :
                    targets?.map(tar => (
                    <TargetCard key={tar.id} target={tar} organization={organization} project={project} onUpdate={handleChange} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}