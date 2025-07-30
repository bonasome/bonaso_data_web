import React from 'react';
import { useEffect, useState, useRef } from "react";
import SimpleSelect from "./inputs/SimpleSelect";
import SimpleDynamicRows from './inputs/SimpleDynamicRows';
import validate from '../../../services/validate';
import styles from './dynamicForm.module.css';
import { useAuth } from '../../contexts/UserAuth';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ModelSelect from './inputs/ModelSelect';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import IndicatorsIndex from '../indicators/IndicatorsIndex';
import ClientsIndex from '../projects/clients/ClientsIndex';
import Checkbox from './inputs/Checkbox';
import MultiCheckbox from './inputs/MultiCheckbox';
import ModelMultiSelect from './inputs/ModelMultiSelect';

import Tasks from '../tasks/Tasks';
import IndicatorPrereqLogic from '../indicators/IndicatorPrereqLogic';
import ImgSelect from './inputs/ImageSelect';
//config [{type: , switchpath: false, hideonpath: false, name: , label: null, value: null, required: false, max: null, expand: null, constructors:{values: [], labels: [], multiple: false} }]
export default function DynamicForm({ config, onSubmit, onCancel, onError, saving, createAnother=false }){
    const { user } = useAuth();
    const [formData, setFormData] = useState({})
    const [switchpath, setSwitchpath] = useState(false);
    const [switchpath2, setSwitchpath2] = useState(false);
    const [switchpath3, setSwitchpath3] = useState(false);
    const [retrigger, setRetrigger] = useState(0);
    const rowRefs = useRef({});

    useEffect(() => {
        const struct = {};
        config.forEach(field => {
            if(!field) return
            if(field.constructors && field.constructors.multiple){
                struct[field.name] = field.value || [];
            }
            else if(field.type == 'dynamic'){
                struct[field.name] = field.value || [];
            }
            else if(field.type == 'checkbox'){
                struct[field.name] = field.value || false;
            }
            else if(['indicator', 'organization','indicator-prereq'].includes(field.type)){
                struct[field.name] = field.value || null
            }
            else if(['multi-indicator', 'multi-tasks'].includes(field.type)){
                struct[field.name] = field.value || []
            }
            else{
                struct[field.name] = field.value || '';
            }
            if(field.switchpath){
                setSwitchpath(field.value)
            }
            else if(field.switchpath2){
                setSwitchpath2(field.value)
            }
            else if(field.switchpath3){
                setSwitchpath3(field.value)
            }
        });
        setFormData(struct);
    }, [config, retrigger]);

    const handleSubmit = (e) => {
        let newErrors = []
        e.preventDefault();
        const newFormData = { ...formData };

        config.forEach(field => {
            if(!field) return
            if (field.type === 'dynamic') {
                const ref = rowRefs.current[field.name];
                if (ref?.current?.collect) {
                    const collected = ref.current.collect();
                    if (collected === null) {
                        newErrors.push(`There are errors in the ${field.label} field`);
                    } else {
                        newFormData[field.name] = collected;
                    }
                }
            }
        });

        Array.from(e.target).forEach(target =>{
            const fieldErrors = validate(target);
            if(fieldErrors.length > 0) newErrors.push(...fieldErrors);
        });
        if (newErrors.length > 0) {
            onError(newErrors);
            return;
        }

        const button = e.nativeEvent.submitter;
        const action = button?.value;

        if (action === "normal") {
            onSubmit(newFormData);
        } 
        else if (action === "create") {
            onSubmit(newFormData, true);
            setRetrigger(prev => prev+=1)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else{
            onSubmit(newFormData)
        }
    }
    return(
        <div className={styles.formElement}>
            <form onSubmit={handleSubmit} noValidate={true}>
                {config.map(field => {
                    if(!field) return
                    if(field?.rolerestrict && !field.rolerestrict.includes(user.role)) return <div key={field.name}></div>
                    if(switchpath && field.hideonpath) return <div key={field.name}></div>
                    if(!switchpath && field.showonpath) return <div key={field.name}></div>
                    if(switchpath2 && field.hideonpath2) return <div key={field.name}></div>
                    if(!switchpath2 && field.showonpath2) return <div key={field.name}></div>
                    if(switchpath3 && field.hideonpath3) return <div key={field.name}></div>
                    if(!switchpath3 && field.showonpath3) return <div key={field.name}></div>
                    const label = (field.label || (field.name.charAt(0).toUpperCase() + field.name.slice(1))) + (field.required ? ' *': ' (Optional)');
                    const max = field.max || null
                    if(field.type == 'text'){
                        return(
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={field.name}>{label}</label>
                                <input type='text' id={field.name} required={field.required} max={max} name={field.name} value={formData[field.name] || ''} onChange={(e) => setFormData(prev=>({...prev, [field.name]: e.target.value }))} />
                            </div>
                        )
                    }
                    else if(field.type == 'textarea'){
                        return(
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={field.name}>{label}</label>
                                <textarea type='text' id={field.name} required={field.required} max={max} name={field.name} value={formData[field.name] || ''} onChange={(e) => setFormData(prev=>({...prev, [field.name]: e.target.value }))} className={styles.expanded} />
                            </div>
                        )
                    }
                    else if(field.type == 'number'){
                        return(
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={field.name}>{label}</label>
                                <input type='number' id={field.name} name={field.name} required={field.required} max={max} value={formData[field.name] || ''} onChange={(e) => setFormData(prev=>({...prev, [field.name]: e.target.value }))} />
                            </div>
                        )
                    }
                    else if(field.type == 'email'){
                        return(
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={field.name}>{label}</label>
                                <input type='email' id={field.name} name={field.name} required={field.required} max={max} value={formData[field.name] || ''} onChange={(e) => setFormData(prev=>({...prev, [field.name]: e.target.value }))} />
                            </div>
                        )
                    }
                    else if(field.type == 'password'){
                        return(
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={field.name}>{label}</label>
                                <input type='password' id={field.name} name={field.name} required={field.required} max={max} value={formData[field.name] || ''} onChange={(e) => setFormData(prev=>({...prev, [field.name]: e.target.value }))} />
                            </div>
                        )
                    }
                    else if(field.type == 'date'){
                        return(
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={field.name}>{label}</label>
                                <input type='date' id={field.name} name={field.name} required={field.required} max={max} value={formData[field.name] || ''} onChange={(e) => setFormData(prev=>({...prev, [field.name]: e.target.value }))} />
                            </div>
                        )
                    }
                    else if(field.type == 'select'){
                        if(!field.constructors.values) return <div key={field.name}></div>
                        return(
                            <div key={field.name} className={styles.field}>
                                <SimpleSelect name={field.name} label={label} 
                                required={field.required} 
                                optionValues={field.constructors.values} 
                                optionLabels={field.constructors.labels} 
                                defaultOption={field.value} 
                                multiple={field.constructors.multiple} 
                                search={field?.constructors?.search ? field?.constructors?.search : false}
                                searchCallback={field?.constructors?.search ? field?.constructors?.searchCallback : null}
                                callback={(val) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        [field.name]: val
                                    }));
                                    field.switchpath && setSwitchpath(field.switchpath === val);
                                    field.switchpath2 && setSwitchpath2(field.switchpath2===val);
                                    field.switchpath3 && setSwitchpath3(field.switchpath3===val);
                                }} />
                            </div>
                        )
                    }
                    else if(field.type == 'multi-select'){
                        if(!field.constructors.values) return <div key={field.name}></div>
                        return(
                            <div key={field.name} className={styles.field}>
                                <MultiCheckbox callback={(val) => {setFormData(prev => ({...prev,[field.name]: val}));}}
                                    optionLabels={field.constructors.labels} optionValues={field.constructors.values}
                                    name={field.name} label={label} existing={field.value} />
                            </div>
                        )
                    }
                    else if(field.type == 'checkbox'){
                        return(
                            <div key={field.name} className={styles.checkboxField}>
                                <Checkbox name={field.name} label={field.label} checked={field.value} callback={(c) => {
                                    setFormData(prev=>({...prev, [field.name]: c })); 
                                        field.switchpath && setSwitchpath(c); 
                                        field.switchpath2 && setSwitchpath2(c); 
                                        field.switchpath3 && setSwitchpath3(c);
                                }} />
                            </div>
                        )
                    }
                    else if(field.type == 'dynamic'){
                        if (!rowRefs.current[field.name]) {
                            rowRefs.current[field.name] = React.createRef();
                        }
                        return (
                            <SimpleDynamicRows key={field.name} label={field.label} ref={rowRefs.current[field.name]} existing={formData[field.name] || []}/>
                        )
                    }
                    else if(field.type == 'indicator'){
                        return(
                            <div className={styles.field}>
                                <ModelSelect IndexComponent={IndicatorsIndex} title={field.label} existing={field.value} callbackText={field?.callbackText || 'Select Indicator'}
                                    callback={(ind) => setFormData(prev=>({...prev, [field.name]: ind?.id || null }))}
                                /> 
                            </div>
                        )
                    }
                    else if(field.type === 'indicator-prereq'){
                        return(
                            <div className={styles.field}>
                                <IndicatorPrereqLogic existing={field.value} callback={(inds, match) => {
                                    setFormData(prev=>({...prev, prerequisite_ids: inds || [], match_subcategories_to: match || null}));
                                    setSwitchpath3(match ? true : false);}}
                                />
                            </div>
                        )
                    }
                    else if(field.type === 'multi-tasks'){
                        return(
                            <div className={styles.field}>
                                <ModelMultiSelect title={field.label} IndexComponent={Tasks} callbackText={field.callbackText} callback={(sel) => setFormData(prev => ({ ...prev, [field.name]: sel || []}))} task={true} existing={field.value} />
                            </div>
                        )
                    }
                    else if(field.type == 'organization'){
                        return(
                            <div className={styles.field}>
                                <ModelSelect IndexComponent={OrganizationsIndex} title={field.label} callbackText={field?.callbackText || 'Select Organization'} existing={field.value} callback={(org) => setFormData(prev=>({...prev, [field.name]: org?.id || null }))} /> 
                            </div>
                        )
                    }
                    else if(field.type == 'client'){
                        return(
                            <div className={styles.field}>
                                <ModelSelect IndexComponent={ClientsIndex} title={field.label} existing={field.value} callbackText={field?.callbackText || 'Select Client'} callback={(cl) => setFormData(prev=>({...prev, [field.name]: cl?.id || null }))} /> 
                            </div>
                        )
                    }
                    else if(field.type == 'image'){
                        return(
                            <div className={styles.field}>
                                <ImgSelect title={field.label} config={field.constructors} existing={field.value} multiple={field?.constructors?.multiple ?? false} 
                                    callback={(val) => {setFormData(prev => ({ ...prev, [field.name]: val || []}));
                                        setSwitchpath(val===field.switchpath);}}
                                />
                            </div>
                        )
                    }
                })}
                {saving && <ButtonLoading />} 
                
                {!saving && <button type="submit" value="normal">Save</button>}
                {!saving && createAnother && <button type="submit" value="create">Save & Create Another</button>}
                <button type="button" onClick={onCancel}>Cancel</button>
            </form>
        </div>
    )
}