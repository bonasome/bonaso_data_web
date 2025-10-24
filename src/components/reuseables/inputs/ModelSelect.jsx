import { useState, useEffect } from 'react';

import cleanLabels from '../../../../services/cleanLabels';

import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from '../../../styles/indexSelect.module.css';
import modalStyles from '../../../styles/modals.module.css';



import { FaCheckSquare } from "react-icons/fa";
import { FcCancel } from 'react-icons/fc';

export default function ModelSelect({ name, IndexComponent, value, onChange, label,  errors, tooltip=null, labelField='name', includeParams=[], excludeParams=[], blacklist=[] }){
    /*
    Allows a user to select a single model instances for a foreign key field. Displays a modal 
    while the user is selecting and hides it once a value is selected. 
    Utilizes an IndexComponent and its callback feature.

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
    - blacklist (array, optional): list of object IDs to hide from an IndexComponent
    - tooltip (string, optional): text to display when hovering over a tooltip (no tooltip will show if left null)
    - callbackText (string, optional): text to display in button for selecting
    - errors (array, RHF): field errors
    */

    //is the user actively selectinga  value
    const [selecting, setSelecting] = useState(false);

    return(
        <div>
            <label style={{ display: 'flex', flexDirection: 'row' }}>
                    <p>{label}</p>
                    {tooltip && <Tooltip msg={tooltip} />}
            </label>
            <fieldset style={{ border: 'none' }} name={name}>
                <Messages errors={errors} />
                <div className={styles.card}>
                    {value ? <p>Selected: <i>{value[labelField]}</i></p> : <p>Nothing selected</p>}
                    <button type="button" onClick={() => setSelecting(true)}>Choose a new {cleanLabels(name)}</button>
                    <button type="button" onClick={() => onChange(null)} disabled={!value}>Clear Selection</button>
                    <div className={modalStyles.modal} style={{ display: selecting ? 'block' : 'none' }}>
                        <div style={{ height: '90%', overflowY: 'scroll', overflowX: 'hidden' }}>
                            <IndexComponent callback={(obj) => {onChange(obj); setSelecting(false)}} includeParams={includeParams} excludeParams={excludeParams} blacklist={blacklist}/>
                        </div>
                        <div style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center'}}>
                            <button onClick={() => setSelecting(false)} type='button'><FcCancel />Cancel</button>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    )
}