import { useState, useEffect, useMemo } from 'react';
import { useForm,  useWatch } from "react-hook-form";

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Messages from '../../reuseables/Messages';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import OrganizationsIndex from '../../organizations/OrganizationsIndex';
import FormSection from '../../reuseables/forms/FormSection';

import modalStyles from '../../../styles/modals.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";

//modal to create/edit announcement
export default function ComposeAnnouncementModal({ onClose, onUpdate, projectID=null, existing=null }){
    const { user } = useAuth();
    //meta
    const [saving, setSaving] = useState(false);
    const [pageErrors, setPageErrors] = useState([]);
    
    //handle submission 
    const onSubmit = async(data) => {
        setPageErrors([]);
        let sbWarnings = [];
        data.organization_ids = data.organization_ids.map((org) => (org.id))
        try{
            setSaving(true);
            data.project_id = existing?.project?.id ?? projectID
            const url = existing ? `/api/messages/announcements/${existing.id}/` : `/api/messages/announcements/`
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData);
                onClose();  
            }
            else{
                const serverResponse = []
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
                setPageErrors(serverResponse)
            }
        }
        catch(err){
            setPageErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record organization: ', err)
        }
        finally{
            setSaving(false)
        }

    }

    const defaultValues = useMemo(() => {
            return {
                subject: existing?.subject ?? '',
                body: existing?.body ?? '',
                organization_ids: existing?.organizations ?? [],
                cascade_to_children: existing?.cascade_to_children ?? false,
                visible_to_all: existing?.visible_to_all ?? false
            }
        }, [existing]);
    
    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);


    const basics = [
        { name: 'subject', label: 'Subject (Required)', type: "text", rules: { required: "Required" },
            tooltip: 'Subject will appear on the unexpanded card. Let people know what this is about!'
        },
        { name: 'body', label: "Body (Required)", type: "textarea", rules: { required: "Required" },
            tooltip: 'What do you want to announce? A deadline reminder? An important update?'
        },
    ]
    const orgs = [
        {name: 'cascade_to_children', label: 'Make Visible to Subgrantees?', type: 'checkbox'},
        { name: 'organization_ids', label: "Organizations Involved", type: "multimodel", IndexComponent: OrganizationsIndex,
            labelField: 'name',
        },
    ]
    const admin= [
        {name: 'visible_to_all', label: 'Make Visible to All', type: 'checkbox',
            tooltip: `Checking this box will make this visible to all members${projectID ? ' with access to this project' : ''}.`
        }
    ]

    return(
        <div className={modalStyles.modal}>
            <h1>{existing ? `Editing Announcement` : 'New Announcement' }</h1>
            <Messages errors={pageErrors} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basics} control={control} />
                {projectID && <FormSection fields={orgs} control={control} />}
                {user.role === 'admin' && <FormSection fields={admin} control={control} />}
                {!saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={() => onClose()}>
                        <FcCancel /> Cancel
                    </button>
                </div>}
                {saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <ButtonLoading />
                </div>}
            </form>
        </div>
    )
}
