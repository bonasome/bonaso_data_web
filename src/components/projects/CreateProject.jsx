import { useState, useCallback, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import SimpleSelect from "../reuseables/SimpleSelect";
import Input from "../reuseables/Input";
import fetchWithAuth from "../../../services/fetchWithAuth";
import validate from "../../../services/validate";

const initialFormState = {
    name: '',
    status: 'Planned',
    description: '',
    start: '',
    end: '',
    client: '',
}

export default function CreateProject(){
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [options, setOptions] = useState({
        clientValues: [], 
        clientLabels: [],
        statusValues: [],
        statusLabels: [],
    })
    useEffect(() => {
        const getOptions = async() => {
            try{
                const response = await fetchWithAuth(`projects/api/get-model-info/`);
                const data = await response.json();
                setOptions({
                    clientValues: data.values.clients,
                    clientLabels: data.labels.clients,
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
        console.log('Submitting project...', formData);
        let newErrors = [];
        e.preventDefault();
        Array.from(e.target).forEach(target =>{
            const fieldErrors = validate(target);
            if(fieldErrors.length > 0) newErrors.push(...fieldErrors);
        });
        if(formData.start > formData.end){
            newErrors.push('Project start date must be after project end date.')
        }
        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        try{
            const response = await fetchWithAuth('projects/api/create/', {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify({formData})
            });
            const data = await response.json();
            if(data.status == 'success'){
                const projectID = data.redirect_id
                navigate(`/projects/${projectID}/view`);
            }
        }
        catch(err){
            console.error('Could not record project: ', err)
        }
        
    }

    if(loading) return <p>Loading...</p>

    return(
        <div>
            <h1>Creating a New Project</h1>
            <form onSubmit={handleSubmit}>
                {errors &&  <ul>{errors.map((e)=><li key={e}>{e}</li>)}</ul>}
                <Input name={'name'} type={'text'} required={true} label={'Project Name'} maxLength={255} callback={handleChange} />
                <SimpleSelect name={'status'} label={'Project Status'} optionValues={options.statusValues} optionLabels={options.statusLabels} required={true} defaultOption={'Planned'} nullOption={false} />
                {options.clientValues.length > 0 ? 
                    <SimpleSelect name={'client'} label={'Project Commissioned by'} optionValues={options.clientValues} optionLabels={options.clientLabels} required={false} nullOption={true} search={true}/> 
                    : <p>Hmm... No clients have been created yet. Please make a note to check this field later.</p>}
                <Input name={'description'} type={'text'} required={false} label={'Brief Description of the Project'} callback={handleChange} />
                <Input name={'start'} type={'date'} required={true} label={'Project Start Date'} callback={handleChange} />
                <Input name={'end'} type={'date'} required={true} label={'Project Conclusion Date'} callback={handleChange} />
                <button>Save Project</button>
            </form>
        </div>
    )
}