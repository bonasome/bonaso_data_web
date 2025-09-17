import { useState, useEffect, useMemo } from "react";
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import { useAuth } from '../../../contexts/UserAuth'
import { useInteractions } from '../../../contexts/InteractionsContext';

import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import Checkbox from '../../reuseables/inputs/Checkbox';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import FlagModal from '../../flags/FlagModal';
import FlagDetailModal from "../../flags/FlagDetailModal";
import FormSection from '../../reuseables/forms/FormSection'
import Messages from '../../reuseables/Messages';

import styles from '../respondentDetail.module.css';
import errorStyles from '../../../styles/errors.module.css';

import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosSave } from "react-icons/io";
import { MdFlag } from "react-icons/md";
import { FcCancel } from "react-icons/fc";

export default function InteractionCard({ interaction, onUpdate, onDelete }){
    /*
    Card that displays information about an interaction and also allows for the user to edit this information.
    - interaction (object): the interaction to display information about
    - onUpdate (function): what to do when the interaction is edited
    - onDelete (function): what to do when the interaction is deleted
    */
    const { user } = useAuth();
    const {setInteractions} = useInteractions();

    //page meta
    const [editing, setEditing] = useState(false); //controls when user is editing the details
    const [expanded, setExpanded] = useState(false);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [del, setDel] = useState(false);
    const [flagging, setFlagging] = useState(false); //controls when a user is flagging the interaction
    const [viewFlags, setViewFlags] = useState(false); //controls when a user is viewing flag information

    

    //quick memo to check for an unresolved flag
    const activeFlags = useMemo(() => {
        if(!interaction) return false
        return interaction?.flags?.filter(f => !f.resolved).length > 0;
    }, [interaction])

    
    //check if user is an meofficer/manager of the organizaiton or their parent org or is an admin
    //or check if they created the interaction, in which case they can edit
    const hasPerm = useMemo(() => {
        if(user.role == 'admin') return true;
        else if (user.role == 'meofficer' || user.role == 'manager'){
            if(interaction?.task?.organization?.id == user.organization_id || 
                interaction?.parent_organization == user.organization_id) return true;
        }
        else if(user?.id == interaction?.created_by?.id) return true;
        return false;
    }, []);

    //handle deleting an interaction
    const deleteInteraction = async() => {
        try {
            console.log('deleting interaction...');
            const response = await fetchWithAuth(`/api/record/interactions/${interaction.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(interaction.id)
                setSubmissionErrors([]);
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
                setSubmissionErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete interaction:', err);
            setSubmissionErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false)
        }
    }

    //handle editing an interaction
    const onSubmit = async(data) =>{
        try{
            setSaving(true);
            console.log('submitting edits...', data)
            //the backend will start pouting if this is an empty string, and you know how the backend gets when its angry. 500 city
            if(data.subcategories_data.length > 0 && !interaction?.task?.indicator?.require_numeric){
                data.subcategories_data = data.subcategories_data.map(sc => ({id: null, subcategory: {id: sc}}))
            }
            if(data.numeric_component == '') data.numeric_component = null;
            const url = `/api/record/interactions/${interaction.id}/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setInteractions(prev => {
                    const others = prev.filter(r => r.id !== interaction.id);
                    return [...others, returnData];
                });
                setEditing(false);
                onUpdate();
                setSubmissionErrors([]);
            }
            else{
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                    returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                console.log(returnData)
                setSubmissionErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to interaction:', err);
            setSubmissionErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }

    //set default values (this should only ever be used with existing values)
    const defaultValues = useMemo(() => {
        return {
            interaction_date: interaction?.interaction_date ?? '',
            interaction_location: interaction?.interaction_location ?? '',
            subcategories_data: (interaction?.task?.indicator?.require_numeric ? interaction?.subcategories : interaction?.subcategories?.map(ir => ir?.subcategory?.id)) ?? '',
            numeric_component: interaction?.numeric_component ?? '',
        }
    }, [interaction]);

    //construct RHF variables
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });

    //scroll to field errors on submission
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
    //load existing values once existing loads, if provided
    useEffect(() => {
        if (interaction) {
            reset(defaultValues);
        }
    }, [interaction, reset, defaultValues]);

    const basics = [
        { name: 'interaction_date', label: 'Date', type: "date", rules: { required: "Required" },
            tooltip: 'When did this interaction take place.',
        },
         { name: 'interaction_location', label: 'Location', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: 'Gaborone clinic...', tooltip: 'Where did this interaction take place?.',
        },
    ]
    //show only if subcats are required
    const subcats = [
        { name: 'subcategories_data', label: 'Date', type: `${interaction?.task?.indicator?.require_numeric ? 'multiselectnum' : 'multiselect'}`, 
            rules: { required: "Required" }, options: interaction?.task?.indicator?.subcategories, valueField: 'id', labelField: 'name',
            tooltip: 'Please select all relvent subcategories that are applicable for this interaction.',
        },
    ]
    //show only if a number is required by no subcats
    const number = [
        { name: 'numeric_component', label: 'Enter a Number', type: "number", rules: { required: "Required" },
            tooltip: 'Please enter an associated number.',
        },
    ]

    if(!interaction.task) return <ComponentLoading />
    //return this separetly if needed since the otherwise the hover features will mess with the modeal styles
    if(del){
        return(
            <ConfirmDelete name={`Interaction ${interaction?.display_name}`} statusWarning={'This cannot be undone, and this data will be lost. Consider flagging this instead if you are unsure.'} 
                onConfirm={() => deleteInteraction()} onCancel={() => setDel(false)} />
        )
    }
    
    if(flagging){
        return(
            <FlagModal id={interaction.id} model={'respondents.interaction'} onCancel={() => setFlagging(false)}
                onConfirm={() => {onUpdate(); setFlagging(false)}} />
        )
    }
    if(viewFlags){
        return(
            <FlagDetailModal flags={interaction.flags} displayName={interaction.display_name} 
                onClose={() => {onUpdate(); setViewFlags(false)}}/>
        )
    }

    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <h3>{interaction.display_name}</h3>
            {interaction?.flags.length > 0 && <div className={activeFlags ? errorStyles.warnings : errorStyles.success} onClick={() => setViewFlags(true)}>
                {interaction?.flags.filter(f => !f.resolved).length > 0 ? <h3>This interaction has active flags.</h3> : <h3>This interacion previously had flags.</h3>}
            </div>}
            {!editing && <div>
                <p>{prettyDates(interaction.interaction_date)}</p>
                <p>{interaction.interaction_location}</p>
            </div>}

            {expanded && !editing && <div onClick={(e) => e.stopPropagation()}>
                <p>By {interaction.task.organization.name}</p>
                {interaction.subcategories && interaction.subcategories.length >0 &&
                    <div>
                        <p>Subcategories:</p>
                        <ul>
                            {interaction.subcategories.map((cat) => (<li key={cat.id}>{cat.subcategory.name} {cat.numeric_component && `(${cat.numeric_component})`}</li> ))}
                        </ul>
                    </div>
                }

                {interaction.numeric_component && <p>{interaction.numeric_component}</p>}

                {interaction.comments && <div>
                    <h3>Comments:</h3>
                    <p>{interaction.comments}</p>
                </div>}

                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    {hasPerm && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={`Edit Details`} />}
                    {hasPerm && <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Raise New Flag'} forWarning={true} />}
                    {user.role == 'admin' && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Record'} forDelete={true} />}
                    {del && <ButtonLoading forDelete={true} /> }
                </div>
                <UpdateRecord created_at={interaction.created_at} created_by = {interaction.created_by}
                    updated_at={interaction.updated_at} updated_by={interaction.updated_by} /> 
                
            </div>}

            {editing && <div onClick={(e) => e.stopPropagation()}>
                 <h2>{`Editing ${interaction?.display_name}`}</h2>
                <Messages errors={submissionErrors} />
                <form onSubmit={handleSubmit(onSubmit, onError)}>
                    <FormSection fields={basics} control={control} header={'Basic Information'} />
                    <FormSection fields={subcats} control={control} header={'Subcategories'}/>
                    {interaction.task.indicator.require_numeric && 
                        !interaction.task.indicator.subcategories.length > 0 &&
                        <FormSection fields={number} control={control} header={'Numeric Component'} />}
                    
                    {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <button type="submit" value='normal'><IoIosSave /> Save</button>
                        <button type="button" onClick={() => setEditing(false)}><FcCancel /> Cancel</button>
                    </div>}

                    {saving && <ButtonLoading />}
                </form>
            </div>}
        </div>
    )
}