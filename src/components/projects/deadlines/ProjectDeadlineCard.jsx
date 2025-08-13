import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import Messages from '../../reuseables/Messages';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";

import styles from '../projectDetail.module.css';


export default function ProjectDeadlineCard({ deadline, project, onDelete }) {
    //context
    const { user } = useAuth();

    //deadline info, completed and if its applicable
    const [completed, setCompleted] = useState(false);
    const [unrelated, setUnrelated] = useState(true);

    //control card properties
    const [expanded, setExpanded] = useState(false);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);
    //quick function to determine this organization's deadline status
    useEffect(() => {
        const orgMatch = deadline.organizations?.find(org => org.id === user.organization_id);

        if (orgMatch) {
            setCompleted(orgMatch.completed === true);
        } 
        else {
            setUnrelated(true);  // assuming unrelated means "not in the list"
        }
    }, [deadline]);

    //helper to mark the deadline as completed
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

    //delete the deadline
    const deleteDeadline = async () => {
        try {
            console.log('deleting deadline...');
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
            console.error('Failed to delete deadline:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false);
        }
    }

    if(del){
        return(
            <ConfirmDelete name='Deadline' onConfirm={() => deleteDeadline()} onCancel={() => setDel(false)} />
        )
    }

    return(
        <div className={styles.infoCard} onClick={() => setExpanded(!expanded)}>
            <div>
                <h3>{deadline.name}</h3>
                <Messages errors={errors} />
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
                    <UpdateRecord created_by={deadline.created_by} created_at={deadline.created_at} updated_by={deadline.updated_by} updated_at={deadline.updated_at} />
                    <Link to={`/projects/${project}/deadlines/${deadline.id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Deadline'} forDelete={true} />
                </div>
            </div>}
        </div>
    )
}