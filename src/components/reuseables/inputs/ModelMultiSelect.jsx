import { useState, useEffect } from 'react';

import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from '../../../styles/indexSelect.module.css';
import modalStyles from '../../../styles/modals.module.css';

//select multiple models from an index component
export default function ModelMultiSelect({ name, IndexComponent, value, onChange, label, errors=[], tooltip=null, callbackText, labelField='display_name', includeParams=[], excludeParams=[], projAdd=false, addRedirect=null, blacklist=[] }){
    /*
    Allows a user to select multiple model instances for m2m or many-to-one fields. Displays a modal 
    while the user is selecting. Utilizes an IndexComponent and its callback feature.

    - type (string): what type of data is this collecting (used to determine what type of input to show)
    - name (string): name the input should use (for html name/id)
    - label (string): what the user should see
    - options (array, optional): if creating for radio/checkbox/select/image select, what are the options as an 
        array of objects with a value and label field
    - IndexComponent (component, optional): if using a model select to select a foreign key, pass the index component
        that contains the list of components you want the user to see
    - labelField (string, optional): used with options/IndexComponent, tells the component what key in 
        the object to use as the label (default, label)
    - valueField (string, optional): used with options/IndexComponent, tells the coomponent what key in 
        the object to use as the value (default, value)
    - images (array, optional): used with image select to display a list of icons. Expected to be in the same
         order as the options array
    - includeParams (array, optional): used with IndexComponent to pass a URL filter to only show values that 
        meet certain criteria (array of objects like {filed: 'field', value: value})
    - excludeParams (array, optional): used with IndexComponent to pass a URL filter to hide values that meet 
        certain criteria (array of objects like {filed: 'field', value: value})
    - projAdd (integer, optional): id of project for a specific circumstance where a user is adding orgs to a project and needs access 
        to orgs they normally shouldn't have access to (only used for adding subgrantees)
    - addRedirect (object, optional): information for redirecting if using the create button within the index component while this is 
        active (also only used for adding subgrantees)
    - blacklist (array, optional): list of object IDs to hide from an IndexComponent
    - tooltip (string, optional): text to display when hovering over a tooltip (no tooltip will show if left null)
    - callbackText (string, optional): text to display in button for selecting
    - errors (array, RHF): field errors
    */

    //is the user actively selecting new values
    const [selecting, setSelecting] = useState(false);
    
    //handle the user adding a new value
    const handleAdd = (obj) => {
        const inSelected = value.filter((v) => v.id === obj.id).length > 0;
        if(inSelected) return;
        onChange([...value, obj])
    }
    //remove a selected value
    const remove = (obj) => {
        const updated = value.filter((ex) => (ex.id != obj.id))
        onChange(updated)
    }

    //already selected values (so they can be hidden)
    const selectedVals = value?.map((val) => (val.id)) ?? [];

    return(
        <div>
            <label style={{ display: 'flex', flexDirection: 'row' }}>
                {label}
                {tooltip && <Tooltip msg={tooltip} />}
            </label>
            <fieldset style={{ border: 'none' }} name={name}>
                <div >
                    
                </div>
                <Messages errors={errors} />
                <div className={styles.card}>
                    {value.length > 0 ? 
                        <div>
                            {value.map((v) => (<div style={{ display: 'flex', flexDirection: 'row'}}>
                                <p>{v[labelField]}</p>
                                <button type="button" onClick = {() => remove(v)} style={{ marginLeft: 'auto'}}>Remove</button>
                            </div>))}
                        </div>
                    
                    : <p>Nothing selected</p>}
                    <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Select'}</button>
                    <button type="button" onClick={() => onChange([])} disabled={(!value || value.length === 0)}>Clear Selection</button>
                    {selecting && <div className={modalStyles.modal}>
                        <h2>{label}</h2>
                        <div style={{ height: '90%', overflowY: 'scroll', overflowX: 'hidden' }}>
                            <IndexComponent callback={(obj) => handleAdd(obj)} callbackText={callbackText} blacklist={[...selectedVals, ...blacklist]} includeParams={includeParams} excludeParams={excludeParams} projAdd={projAdd} addRedirect={addRedirect} />
                        </div>
                        <button onClick={() => setSelecting(false)}>Done</button>
                    </div>}
                </div>
            </fieldset>
        </div>
    )
}