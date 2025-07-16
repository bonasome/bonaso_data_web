import React from 'react';
import { useEffect, useState, useRef } from "react";
import SimpleSelect from "./SimpleSelect";
import SimpleDynamicRows from './SimpleDynamicRows';
import validate from '../../../services/validate';
import styles from './dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';
import { useAuth } from '../../contexts/UserAuth';
import ButtonLoading from '../reuseables/ButtonLoading';
import IndicatorSelect from '../indicators/IndicatorSelect';
import OrganizationSelect from '../organizations/OrganizationSelect';
import ClientSelect from '../projects/clients/ClientSelect';
import IndicatorMultiSelect from '../indicators/IndicatorMultiSelect';

//config [{type: , switchpath: false, hideonpath: false, name: , label: null, value: null, required: false, max: null, expand: null, constructors:{values: [], labels: [], multiple: false} }]
export default function DynamicForm({ config, onSubmit, onCancel, onError, saving }){
    const { user } = useAuth();
    const [formData, setFormData] = useState({})
    const [errors, setErrors] = useState([])
    const [switchpath, setSwitchpath] = useState(false);
    const [switchpath2, setSwitchpath2] = useState(false);
    const [switchpath3, setSwitchpath3] = useState(false);
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
    }, [config]);
    
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
        onSubmit(newFormData);
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
                    else if(field.type == 'checkbox'){
                        return(
                            <div key={field.name} className={styles.checkboxField}>
                                <input type="checkbox" id={field.name} name={field.name} checked={!!formData[field.name]}  
                                    onChange={(e) => {setFormData(prev=>({...prev, [field.name]: e.target.checked })); 
                                        field.switchpath && setSwitchpath(e.target.checked); 
                                        field.switchpath2 && setSwitchpath2(e.target.checked); 
                                        field.switchpath3 && setSwitchpath3(e.target.checked)
                                    }} 
                                />
                                <label htmlFor={field.name}>{label}</label>
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
                                <IndicatorSelect title={field.label} existing={field.value} 
                                    onChange={(ind) => setFormData(prev=>({...prev, [field.name]: ind?.id || null }))}
                                /> 
                            </div>
                        )
                    }
                    else if(field.type === 'multi-indicators'){
                        return(
                            <div className={styles.field}>
                                <IndicatorMultiSelect title={field.label} existing={field.value} callbackText={field.callbackText}
                                    subcats={true} exisitingFollowUp={field.followUpValue}
                                    onChange={(sel, setPath, fuv) => {setFormData(prev=>({...prev, [field.name]: sel || null, [field.followUp]: fuv || null })); 
                                        setPath ? setSwitchpath3(setPath) : setSwitchpath3(false)
                                    }} 
                                /> 
                            </div>
                        )
                    }
                    else if(field.type == 'organization'){
                        return(
                            <div className={styles.field}>
                                <OrganizationSelect title={field.label} callbackText={field?.callbackText || 'Select'} existing={field.value} onChange={(org) => setFormData(prev=>({...prev, [field.name]: org?.id || null }))} /> 
                            </div>
                        )
                    }
                    else if(field.type == 'client'){
                        return(
                            <div className={styles.field}>
                                <ClientSelect title={field.label} existing={field.value} onChange={(cl) => setFormData(prev=>({...prev, [field.name]: cl?.id || null }))} /> 
                            </div>
                        )
                    }
                })}
                {saving ? <ButtonLoading /> : <button type="submit">Save</button>}
                <button type="button" onClick={onCancel}>Cancel</button>
            </form>
        </div>
    )
}