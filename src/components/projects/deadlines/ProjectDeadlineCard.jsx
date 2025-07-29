import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { Link } from 'react-router-dom';
import prettyDates from '../../../../services/prettyDates';
import styles from '../projectDetail.module.css';
import { useAuth } from '../../../contexts/UserAuth';

export default function ProjectDeadlineCard({ deadline, project, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [del, setDel] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [unrelated, setUnrelated] = useState(true)
    const { user } = useAuth();

    useEffect(() => {
        const orgMatch = deadline.organizations?.find(org => org.id === user.organization_id);

        if (orgMatch) {
            setCompleted(orgMatch.completed === true);
        } 
        else {
            setUnrelated(true);  // assuming unrelated means "not in the list"
        }
    }, [deadline]);


    const markComplete = async (org) => {
        try{
            console.log('marking complete...')
            const response = await fetchWithAuth(`/api/manage/deadlines/${deadline.id}/mark-complete/`,{
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'organization_id': org})
            });
            if (response.ok) {
                setCompleted(true);
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }
                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } 
                    else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
    }

    const deleteActivity = async () => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/manage/deadlines/${deadline.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete()
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }
                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } 
                    else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false);
        }
    }
    console.log(deadline)
    if(del){
        return(
            <ConfirmDelete name='Deadline' onConfirm={() => deleteActivity()} onCancel={() => setDel(false)} />
        )
    }
    return(
        <div className={styles.infoCard} onClick={() => setExpanded(!expanded)}>
            <div>
                <h3>{deadline.name}</h3>
            </div>
            {expanded && <div>
                <p><strong>Due: {prettyDates(deadline.deadline_date)}</strong></p>
                {deadline.description && <p>{deadline.description}</p>}
                {deadline.organizations.length > 0 && <p>For: {deadline.organizations.map((org) => (`${org.name}`)).join(', ')}</p>}
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    {!completed && !unrelated &&
                        <ButtonHover callback={() => markComplete(user.organization_id)} noHover={<FaTrashAlt />} hover={'Mark Complete'} />}
                    {completed &&
                        <p>Deadline met, awesome work!</p>}
                    <Link to={`/projects/${project.id}/deadlines/${deadline.id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Deadline'} forDelete={true} />
                </div>
            </div>}
        </div>
    )
}