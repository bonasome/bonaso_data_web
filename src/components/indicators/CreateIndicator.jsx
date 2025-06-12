import { useState, useCallback, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Input from "../reuseables/Input";
import SimpleSelect from '../reuseables/SimpleSelect';
import fetchWithAuth from "../../../services/fetchWithAuth";
import validate from "../../../services/validate";

const initialFormState = {
    code: '',
    name: '',
    status: 'Active',
    description: '',
}

export default function CreateIndicator(){
    const navigate = useNavigate();

    const[loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState([]);
    const [redirectLocation, setRedirectLocation] = useState('');
    const [serverMessage, setServerMessage] = useState([]);
    const [options, setOptions] = useState({
        statusValues: [],
        statusLabels: [],
    })
    useEffect(() => {
        const getOptions = async() => {
            try{
                const response = await fetchWithAuth(`indicators/api/get-model-info/`);
                const data = await response.json();
                setOptions({
                    statusValues: data.values.status,
                    statusLabels: data.labels.status,
                });
                setLoading(false);
            }
            catch(err){
                console.error('Could not connect to server: ', err);
                setLoading(false);
            }
        }
        getOptions();
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    })
    
    const handleSubmit = async(e) => {
        let newErrors = [];
        e.preventDefault();
        Array.from(e.target).forEach(target =>{
            const fieldErrors = validate(target);
            if(fieldErrors.length > 0) newErrors.push(...fieldErrors);
        });
        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        const response = await fetchWithAuth('indicators/api/create/', {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify({formData})
        });

        const data = await response.json();
        if(data.status == 'success'){
            if(redirectLocation == '' || redirectLocation == 'detail'){
                navigate(`/indicators`);
            }
            else if(redirectLocation=='create'){
                window.location.reload();
            }
        }
        else if(data.message){
            setServerMessage(data.message);
            return;
        }
    }
    if(loading) return <p>Loading...</p>
    return(
        <div>
            <h1>Creating a New Indicator</h1>
            <form onSubmit={handleSubmit}>
                {errors &&  <ul>{errors.map((e)=><li key={e}>{e}</li>)}</ul>}
                {serverMessage && <ul>{serverMessage.map((m) => <li key={m}>{m}</li>)}</ul>}
                <Input type={'text'} name={'code'} label={'Indicator Code (10 Characters Max)'} required={true} callback={handleChange} maxLength={10}/>
                <Input type={'text'} name={'name'} label={'Indicator Name'} required={true} callback={handleChange} maxLength={255} />
                <SimpleSelect name={'status'} label={'Indicator Status'} optionValues={options.statusValues} optionLabels={options.statusLabels}  required={true} callback={handleChange} nullOption={false} />
                <Input type={'text'} name={'description'} label={'Indicator Description'} required={false} callback={handleChange} />
                <button onClick={()=>setRedirectLocation('detail')}>Submit Indicator</button>
                <button onClick={()=>setRedirectLocation('create')}>Submit Indicator & Create Another</button>
            </form>
        </div>
    )
}