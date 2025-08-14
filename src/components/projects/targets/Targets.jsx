import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import IndexViewWrapper from '../../reuseables/IndexView';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import Messages from '../../reuseables/Messages';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import { EditTargetModal } from './EditTargetModal';
import GaugeChart from './GaugeChart';
import styles from './targets.module.css';

import { PiTargetBold } from "react-icons/pi";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";

export function TargetCard({ target, project, organization, onUpdate, onCancel }){
    //context
    const { user } = useAuth();
    //meta
    const [editing, setEditing] = useState(false);
    const [del, setDel] = useState(false);
    const [expanded, setExpanded] = useState(false);

    //function to delete the target
    const deleteTarget = async() => {
        try {
            console.log('deleting targets...');
            const response = await fetchWithAuth(`/api/manage/targets/${target.id}/`, {
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

    //check if the user should have perms to create/edit targets for the org
    const hasPerm = useMemo(() => {
        if((organization?.parent?.id && user.organization_id == organization.parent.id) || user.role == 'admin') return true
        return false
    }, [organization, user]);

    
    if(!target || !project || !organization) return <ComponentLoading />

    if(editing) return <EditTargetModal existing={target} project={project} organization={organization} onCancel={() => setEditing(false)} onUpdate={() => onUpdate()}/>
    if(del) return <ConfirmDelete name='Target' onConfirm={() => deleteTarget()} onCancel={() => setDel(false)} />
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <div onClick={() => setExpanded(!expanded)}>
                <h3>Target for {target.display_name}</h3>
                {expanded && <div>
                    <GaugeChart achievement={target.achievement} target={target.related_to ? target.related_as_number :  target.amount} />
                    {target.related_to && <p><i>Measured as {target.percentage_of_related}% of {' ' + target.related_to?.display_name}</i></p>}
                    <p><i>From {(prettyDates(target?.start))} to {prettyDates(target?.end)}</i></p>
                    
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {hasPerm && !editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit'} />}
                        {hasPerm && !editing && !del && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Target'} forDelete={true} />}
                    </div>
                    <UpdateRecord created_by={target.created_by} created_at={target.created_at} updated_by={target.updated_by} updated_at={target.updated_at} />
                </div>}
        </div>
    </div>
    )
}

export default function Targets({ project, organization}) {
    //params for project (id) and organizaton (orgID)
    const { id, orgID } = useParams();
    //context
    const { user } = useAuth();
    //meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [adding, setAdding] =useState(false);
    const [targets, setTargets] = useState([]);
    //indexers
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState(0);

    useEffect(() => {
        const getTargets = async () => {
            if(!id || !orgID) return;
            try {
                console.log('fetching targets...');
                const response = await fetchWithAuth(`/api/manage/targets/?task__organization=${orgID}&task__project=${id}&search=${search}`);
                const data = await response.json();
                if(response.ok){
                    setEntries(data.count);
                    setTargets(data.results);
                    setLoading(false);
                }
            } 
            catch (err) {
                setErrors(['Failed to fetch targets. Please try again later.'])
                console.error('Failed to fetch organization: ', err);
                setLoading(false)
            }
        }
        getTargets();
    }, [id, orgID, search])

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
    //check if the user should have perms to create/edit targets for the org
    const hasPerm = useMemo(() => {
        if((organization?.parent?.id && user.organization_id == organization.parent.id) || user.role == 'admin') return true
        return false
    }, [organization, user]);
    
    if (loading) return <ComponentLoading />
    return (
        <div>
            <Messages errors={errors} />
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