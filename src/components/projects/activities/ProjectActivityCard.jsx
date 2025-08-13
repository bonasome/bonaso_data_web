import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import Messages from '../../reuseables/Messages';

import styles from '../projectDetail.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";

export default function ProjectActivityCard({ activity, project, onDelete }) {
    //context
    const { user } = useAuth();

    //page meta
    const [expanded, setExpanded] = useState(false);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);

    //determine if a user has edit perms (their creation or an admin)
    const hasPerm = useMemo(() => {
        if(!user || !activity) return false
        if(user.role === 'admin') return true;
        if(user.organization_id == activity?.created_by_organization) return true
        return false
    }, [user, activity]);

    //delete an activity
    const deleteActivity = async () => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/manage/activities/${activity.id}/`, {
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
    
    //return delete modal seperately since the card hover messes with the modal
    if(del){
        return(
            <ConfirmDelete name='Activity' onConfirm={() => deleteActivity()} onCancel={() => setDel(false)} />
        )
    }
    return(
        <div className={styles.infoCard} onClick={() => setExpanded(!expanded)}>
            <div>
                <h3>{activity.name}</h3>
                <Messages errors={errors} />
            </div>
            {expanded && <div>
                {activity.start === activity.end ? 
                <i>{prettyDates(activity.start)}</i> : <i>{prettyDates(activity.start)} to {prettyDates(activity.end)}</i>}
                {activity.description && <p>{activity.description}</p>}
                {activity.organizations.length > 0 && <p>From: {activity.organizations.map((org) => (`${org.name}`)).join(', ')}</p>}
                {activity.visible_to_all && <p>Project Wide</p>}
                {hasPerm && <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <Link to={`/projects/${project}/activities/${activity.id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Activity'} forDelete={true} />
                </div>}
                <UpdateRecord created_by={activity.created_by} created_at={activity.created_at} updated_by={activity.updated_by} updated_at={activity.updated_at} />
            </div>}
        </div>
    )
}