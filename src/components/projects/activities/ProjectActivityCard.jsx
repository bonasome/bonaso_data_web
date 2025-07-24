import { useState, useEffect, useMemo } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonHover from '../../reuseables/ButtonHover';
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { Link } from 'react-router-dom';
import prettyDates from '../../../../services/prettyDates';
import styles from '../projectDetail.module.css';
import { useAuth } from '../../../contexts/UserAuth';
export default function ProjectActivityCard({ activity, project, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [del, setDel] = useState(false);
    const { user } = useAuth();
    const hasPerm = useMemo(() => {
        if(!user || !activity) return false
        if(user.role === 'admin') return true;
        if(user.organization_id == activity?.created_by_organization) return true
        return false
    }, [user, activity]);
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
    
    if(del){
        return(
            <ConfirmDelete name='Activity' onConfirm={() => deleteActivity()} onCancel={() => setDel(false)} />
        )
    }
    return(
        <div className={styles.infoCard} onClick={() => setExpanded(!expanded)}>
            <div>
                <h3>{activity.name}</h3>
            </div>
            {expanded && <div>
                {activity.start === activity.end ? 
                <i>{prettyDates(activity.start)}</i> : <i>{prettyDates(activity.start)} to {prettyDates(activity.end)}</i>}
                {activity.description && <p>{activity.description}</p>}
                {activity.organizations.length > 0 && <p>From: {activity.organizations.map((org) => (`${org.name}`)).join(', ')}</p>}
                {activity.visible_to_all && <p>Project Wide</p>}
                {hasPerm && <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <Link to={`/projects/${project.id}/activities/${activity.id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Activity'} forDelete={true} />
                </div>}
            </div>}
        </div>
    )
}