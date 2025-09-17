import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import IndexViewWrapper from '../../reuseables/IndexView';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import Messages from '../../reuseables/Messages';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import GaugeChart from './GaugeChart';
import styles from './targets.module.css';

import { PiTargetBold } from "react-icons/pi";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";

export function TargetCard({ target, project, organization, onUpdate }){
    /*
    An expandable card that displays information about a target.
    - target (object): the target to display information about
    - project (object): the related project
    - organization (object): the organization this target is for
    - onUpdate (function): let the parent component know the target was updated
    */

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
                onUpdate(); //tell the parent component about any updates
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
    //assumes everyone on this page is either meofficer/manager, client, or admin
    const hasPerm = useMemo(() => {
        //either an admin or the parent of the organization
        if((organization?.parent?.id && user.organization_id == organization.parent.id) || user.role == 'admin') return true
        return false
    }, [organization, user]);

    
    if(!target || !project || !organization) return <ComponentLoading />

    //when displaying confirm delete/edit modals, hide the card, since the hover features messes with modal styles
    if(del) return <ConfirmDelete name='Target' onConfirm={() => deleteTarget()} onCancel={() => setDel(false)} />
    
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <div onClick={() => setExpanded(!expanded)}>
                <h3>{target.display_name}</h3>
                {expanded && <div>
                    <GaugeChart achievement={target.achievement} target={target.related_to ? target.related_as_number :  target.amount} />
                    {target.related_to && <p><i>Measured as {target.percentage_of_related}% of {' ' + target.related_to?.display_name}</i></p>}
                    <p><i>From {(prettyDates(target?.start))} to {prettyDates(target?.end)}</i></p>
                    
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {hasPerm && !editing && <Link to={`/projects/${project.id}/organizations/${organization.id}/${target.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit'} /></Link>}
                        {hasPerm && !editing && !del && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Target'} forDelete={true} />}
                    </div>
                    <UpdateRecord created_by={target.created_by} created_at={target.created_at} updated_by={target.updated_by} updated_at={target.updated_at} />
                </div>}
        </div>
    </div>
    )
}

export default function Targets({ project, organization}) {
    /*
    Displays a paginated list of targets related to a project and an organization.
    - project (object): the project the targets should be related to
    - organization (object): the organizaiton
    */
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

    //get the list of targets
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
                navigate(`/not-found`); //navigate to 404 if bad ID is provided
            }
            
        } 
        catch (err) {
            setErrors(['Failed to fetch targets. Please try again later.'])
            console.error('Failed to fetch organization: ', err);
        }
    }

    //load targets on init/search change
    useEffect(() => {
        const initialLoad = async() => {
            await getTargets();
            setLoading(false);
        }
        initialLoad();
    }, [id, orgID, search])

    //check if the user should have perms to create/edit targets for the org
    const hasPerm = useMemo(() => {
        //should be an admin or the parent
        if((organization?.parent?.id && user.organization_id == organization.parent.id) || user.role == 'admin') return true
        return false
    }, [organization, user]);
    
    if (loading) return <ComponentLoading />
    return (
        <div id='targets'>
            <Messages errors={errors} />
            {hasPerm && <Link to={`/projects/${project.id}/organizations/${organization.id}/targets/new`}><button><PiTargetBold /> New Target</button></Link>}
            <IndexViewWrapper entries={entries} onSearchChange={setSearch} page={page} onPageChange={setPage}>
                {(targets && project && organization && targets?.length) == 0 ? 
                    <p>No targets yet. Check back later.</p> :
                    targets?.map(tar => (
                    <TargetCard key={tar.id} target={tar} organization={organization} project={project} onUpdate={getTargets} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}