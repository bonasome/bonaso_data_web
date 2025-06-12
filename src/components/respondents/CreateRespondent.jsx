import { useEffect, useState, useCallback } from 'react';
import Checkbox from '../reuseables/Checkbox';
import SimpleSelect from '../reuseables/SimpleSelect';
import styles from '../../styles/createRespondent.module.css'
import Input from '../reuseables/Input';
import { useNavigate } from 'react-router-dom';
import fetchWithAuth from '../../../services/fetchWithAuth.js';
import validate from '../../../services/validate.js'
const initialFormState = {
    isAnonymous: false,
    id_no: '',
    first_name: '',
    last_name: '',
    sex: 'F',
    age_range: 'under_18',
    dob: '',
    ward: '',
    village: '',
    district: 'Central',
    citizenship: 'Motswana',
    kp_status: [],
    email: '',
    phone_number: '',
};


function CreateRespondent() {
    const [formData, setFormData] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(true);
    const [options, setOptions] = useState({
        sexOptions: [],
        sexLabels: [],
        kpOptions: [],
        kpLabels: [],
        ageRangeOptions: [],
        ageRangeLabels: [],
        districtOptions: [],
        districtLabels: [],
    });
    const {
        sexOptions = [],
        sexLabels = [],
        kpOptions = [],
        kpLabels = [],
        ageRangeOptions = [],
        ageRangeLabels = [],
        districtOptions = [],
        districtLabels = [],
    } = options;

    const toggleAnonymous = useCallback(() => {
        setFormData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }));
    }, []);

    useEffect(() => {
        const getOptions = async() => {
            try{
                const response = await fetchWithAuth(`respondents/api/get-model-info/`);
                const data = await response.json();
                setOptions({
                    sexOptions: data.values.sex,
                    sexLabels: data.labels.sex,
                    kpOptions: data.values.kp,
                    kpLabels: data.labels.kp,
                    ageRangeOptions: data.values.age_range,
                    ageRangeLabels: data.labels.age_range,
                    districtOptions: data.values.district,
                    districtLabels: data.labels.district,
                });
                setIsLoading(false);
            }
            catch(err){
                console.warn('Failed to get options from server: ', err);
                setIsLoading(false);
            }
        }
        getOptions()
    }, [])
    
    const handleChange = useCallback((e) => {
        const { name, value, multiple, options } = e.target;
        if (multiple) {
            const selected = [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected && options[i].value != ''){
                    selected.push(options[i].value);
                }
            }
            setFormData(prev => ({ ...prev, [name]: selected }));
        return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const navigate = useNavigate();
    const [errors, setErrors] = useState([]);

    const handleSubmit = async (e) => {
        let newErrors = []
        e.preventDefault();
        console.log('Submitting form with data:', formData);
        Array.from(e.target).forEach(target =>{
            const fieldErrors = validate(target);
            if(fieldErrors.length > 0) newErrors.push(...fieldErrors);
        });
        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }
        const response = await fetchWithAuth('respondents/api/create/', {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify({formData})
        });
        const data = await response.json();
        if(data.status == 'success'){
            navigate(`/respondents`);
        }
    };

    if(isLoading){
        return(<p>Loading...</p>)
    }
    return(
        <div>
            <div className={styles.header}>
                <h1>Creating New Respondent</h1>
            </div>
            <div className={styles.fields}>
                <form onSubmit={handleSubmit}>
                    <Checkbox label={'Does this person wish to remain anonymous?'} name={'isAnonymous'} callback={toggleAnonymous} required={true}/>
                    {!formData.isAnonymous && (
                        <div>
                            <h3>Basic Information</h3>
                            <Input name={'id_no'} label={'ID or Passport Number'} type={'text'} required={true} callback={handleChange} maxLength={255} />
                            <Input name={'first_name'} label={'First Name'} type={'text'} required={true} placeholder={'if applicable, include middle names or middle initials...'} callback={handleChange} maxLength={150}/>
                            <Input name={'last_name'} label={'Surname'} type={'text'} required={true} callback={handleChange} maxLength={150}/>
                        </div>
                    )}
                    {formData.isAnonymous && (
                        <div>
                            <h3>Essential Information for Anonymous Respondents</h3>
                            <SimpleSelect name={'age_range'} label={'Respondent Age Range'} optionValues={ageRangeOptions} optionLabels={ageRangeLabels} nullOption={false}  callback={handleChange} required={true} />
                        </div>
                    )}
                    <SimpleSelect name={'sex'} optionValues={sexOptions} optionLabels={sexLabels} label={'Respondent Sex'} nullOption={false} callback={handleChange} required={true}/>
                    {!formData.isAnonymous && (
                        <div>
                            <Input name={'dob'} label={'Date of Birth'} type={'date'} required = {true} callback={handleChange} />
                            <Input name={'ward'} label={'Ward'} type={'text'} required={false} callback={handleChange} maxLength={255}/>
                        </div>
                    )}
                    <Input name={'village'} label={'Village'} type={'text'} required={true} placeholder={'e.g. Lobatse, Good Hope, Maun'} callback={handleChange} maxLength={255}/>
                    <SimpleSelect name={'district'} label={'District'} optionValues={districtOptions} optionLabels={districtLabels} nullOption={false} callback={handleChange} required={true} />
                    <Input name={'citizenship'} label={'Citizenship/Nationality'} type={'text'} required={true}  callback={handleChange} maxLength={255}/>
                    <SimpleSelect name={'kp_status'} optionValues={kpOptions} optionLabels={kpLabels} search={true} label={'Key Population Status'} multiple={true} nullOption={true} required={false} callback={handleChange} />
                    {!formData.isAnonymous && (
                        <div>
                            <h3>Contact Information</h3>
                            <Input name={'email'} label={'Email'} type={'email'} required={false} callback={handleChange} maxLength={255}/>
                            <Input name={'phone_number'} label={'Phone Number'} type={'phone'} required={false} callback={handleChange} maxLength={50}/>
                        </div>
                    )}
                    <Input name={'comments'} label={'Comments'} type={'text'} required={false} callback={handleChange} placeholder={'notes about this respondent or things that may help you next time someone interacts with them...'}/>
                    <button>Save Respondent</button>
                    {errors &&  <ul>{errors.map((e)=><li key={e}>{e}</li>)}</ul>}
                </form>
            </div>
        </div>
    )
}

export default CreateRespondent