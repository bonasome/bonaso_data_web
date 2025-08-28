import { useState } from 'react';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ModelMultiSelect from '../reuseables/inputs/ModelMultiSelect';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import IndicatorsIndex from '../indicators/IndicatorsIndex';
import Messages from '../reuseables/Messages';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import modalStyles from '../../styles/modals.module.css';

import { IoIosSave } from 'react-icons/io';
import { FcCancel } from 'react-icons/fc';

/*
A set of special helper models used for selecting tasks/organizations. Since these need to be modals,
the typical model select won't work, and each of these has a special API call. 
*/


export function AssignChild({ organization, project, onUpdate , onClose}){
    /*
    Modal that allows a user to assign one or more child organizations/subgrantees. 
    - organization (object): the organization that the child organizations are being assigned to
    - project (object): the project this action is related to
    - onUpdate (function): what to do on submission of the data
    - onClose (function): how to close the modal
    */

    //meta
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    //the list of selected orgs passed from MultiModalSelect
    const [orgs, setOrgs] = useState([]);
    
    //send selected list to db
    const assignChild = async () => {
        setErrors([]);
        if(orgs.length === 0) {
            setErrors(['Please select at least one organization.']);
            return;
        }
        const child_ids = orgs.map((org) => (org.id)); //convert to ids first
        try {
            console.log('assigning subgrantees...');
            setSaving(true);
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/assign-subgrantee/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'parent_id': organization.id,
                    'child_ids': child_ids,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData);
                onClose();
            }
            else{
                let serverResponse = [];
                if(Array.isArray(returnData)){
                    setErrors(returnData);
                    return;
                }
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                            serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                    serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not assign child: ', err)
        }
        finally{
            setSaving(false);
        }
    } 
    return(
        <div className={modalStyles.modal}>
            <h2>Assigning subgrantees to {organization.name}</h2>
            <Messages errors={errors} />
            <ModelMultiSelect IndexComponent={OrganizationsIndex} projAdd={project.id} 
                addRedirect={{to: 'projects', projectID: project.id, orgID: organization.id }} labelField='name'
                onChange={(vals) => setOrgs(vals)} value={orgs} callbackText='Assign as Subgrantee' 
            />
            {!saving && <div style={{ display: 'flex', flexDirection: 'row'}}>
                <button onClick={() => assignChild()}><IoIosSave /> Confirm Selection & Assign Subgrantees</button>
                <button onClick={() => onClose()}><FcCancel /> Cancel</button>
            </div>}
            {saving && <ButtonLoading />}
        </div>
    )
}


export function AssignTask({ organization, project, onUpdate, onClose }){
    /*
    Modal that allows a user to assign one or more indicators as a task to an organization for a project
    - organization (object): the organization that the indicators are being assigned to
    - project (object): the project this action is related to
    - onUpdate (function): what to do on submission of the data
    - onClose (function): how to close the modal
    */

    //list of selected indicators passed from MultiModalSelect
    const [indicators, setIndicators] = useState([]);
    //meta
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    //send list to db
    const addTask = async () => {
        setErrors([]);
        if(indicators.length === 0) {
            setErrors(['Please select at least one indicator.']);
            return;
        }
        //convert indicator objects to ids
        const indicator_ids = indicators.map((ind) => (ind.id));
        try {
            console.log('assigning task...');
            setSaving(true);
            const response = await fetchWithAuth(`/api/manage/tasks/batch-create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'organization_id': organization.id,
                    'indicator_ids': indicator_ids,
                    'project_id': project.id,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData); //let the parent component know the data was updated
                onClose(); //close the modal
            }
            else{
                let serverResponse = [];
                if(Array.isArray(returnData)){
                    setErrors(returnData);
                    return;
                }
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                            serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                    serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.']);
            console.error('Could not add task: ', err);
        }
        finally{
            setSaving(false);
        }
    } 

    return(
        <div className={modalStyles.modal}>
            <h2>Assigning tasks to {organization.name}</h2>
            <Messages errors={errors} />
            <ModelMultiSelect IndexComponent={IndicatorsIndex} excludeParams={[
                {field: 'project', value: project.id}, {field: 'organization', value: organization.id}
            ]} onChange={(vals) => setIndicators(vals)} value={indicators} callbackText='Assign as Task' />
            {!saving && <div style={{ display: 'flex', flexDirection: 'row'}}>
                <button onClick={() => addTask()}> <IoIosSave /> Confirm Selection & Assign Tasks</button>
                <button onClick={() => onClose()}> <FcCancel /> Cancel</button>
            </div>}
            {saving && <ButtonLoading />}
        </div>
    )
}

export function AssignOrgToProject({ project, onUpdate, onClose}){
    /*
    Modal that allows a user (admin) to assign one or more organizations to a project. 
    - project (object): the project this action is related to
    - onUpdate (function): what to do on submission of the data
    - onClose (function): how to close the modal
    */
    //meta
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    //the list of selected orgs passed from MultiModalSelect
    const [orgs, setOrgs] = useState([]);
    
    //send list to server
    const assignOrg = async () => {
        setErrors([]);

        if(orgs.length === 0) {
            setErrors(['Please select at least one organization.']);
            return;
        }
        const orgIDs = orgs.map((org) => (org.id)); //convert to ids first
        try {
            console.log('assigning organizations...');
            setSaving(true);
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'organization_id': orgIDs,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData); // let the parent component know about the update
                onClose(); //close the modal
            }
            else{
                let serverResponse = [];
                if(Array.isArray(returnData)){
                    setErrors(returnData);
                    return;
                }
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                            serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                    serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not assign organization: ', err)
        }
        finally{
            setSaving(false);
        }
    } 
    return(
        <div className={modalStyles.modal}>
            <h2>Assigning organization to {project.name}</h2>
            <Messages errors={errors} />
            <ModelMultiSelect IndexComponent={OrganizationsIndex} excludeParams={[{field: 'project', value: project.id}]}
                labelField='name' onChange={(vals) => setOrgs(vals)} value={orgs} callbackText={`Assign to ${project.name}`}
            />
            {!saving && <div style={{ display: 'flex', flexDirection: 'row'}}>
                <button onClick={() => assignOrg()}><IoIosSave /> Confirm Selection & Assign Organizations</button>
                <button onClick={() => onClose()}><FcCancel /> Cancel</button>
            </div>}
            {saving && <ButtonLoading />}
        </div>
    )
}