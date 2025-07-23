import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonHover from '../../reuseables/ButtonHover';
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { Link } from 'react-router-dom';
import prettyDates from '../../../../services/prettyDates';

export default function ProjectDeadlineCard({ deadline, project, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [del, setDel] = useState(false);

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
    if(del){
        return(
            <ConfirmDelete name='Deadline' onConfirm={() => deleteActivity()} onCancel={() => setDel(false)} />
        )
    }
    return(
        <div>
            <div onClick={() => setExpanded(!expanded)}>
                <h2>{deadline.name}</h2>
            </div>
            {expanded && <div>
                <p><strong>Due: {prettyDates(deadline.deadline_date)}</strong></p>
                {deadline.description && <p>{deadline.description}</p>}
                {deadline.organizations.length > 0 && <p>For: {deadline.organizations.map((org) => (`${org.name}`)).join(', ')}</p>}
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <Link to={`/projects/${project.id}/deadlines/${deadline.id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} /></Link>
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Deadline'} forDelete={true} />
                </div>
            </div>}
        </div>
    )
}