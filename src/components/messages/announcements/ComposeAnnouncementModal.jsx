import { useState, useEffect, useMemo, useRef } from 'react';
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
    
    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (pageErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [pageErrors]);

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
    
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });


    //scroll to errors
    const onError = (errors) => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            setFocus(firstError); // sets cursor into the field
            // scroll the element into view smoothly
            const field = document.querySelector(`[name="${firstError}"]`);
            if (field && field.scrollIntoView) {
            field.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    };

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
        {name: 'cascade_to_children', label: 'Make Visible to Subgrantees?', type: 'checkbox',
            tooltip: `Check this box to make this visible to all your subgrantees as well as your own organization.`
        },
        { name: 'organization_ids', label: "Organizations Involved", type: "multimodel", IndexComponent: OrganizationsIndex,
            labelField: 'name', tooltip: `If you want this announcement to only be visible to members of specific organizations, you can select them hear.
            Please note that if you have checked the above cascade to children box, you can likely ignore this.`
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
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} useRef={alertRef} />
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
