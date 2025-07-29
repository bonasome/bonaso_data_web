import { useState, useEffect } from 'react';
import ProjectsIndex from '../../projects/ProjectsIndex';
import ModelSelect from '../../reuseables/ModelSelect';
import Checkbox from '../../reuseables/inputs/Checkbox';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/UserAuth';
import errorStyles from '../../../styles/errors.module.css';
import fetchWithAuth from '../../../../services/fetchWithAuth';

export default function ComposeAnnouncements(){
    const { id } = useParams();
    const [body, setBody] = useState('');
    const [subject, setSubject] = useState('')
    const [organization, setOrganization] = useState(null);
    const [cascade, setCascade] = useState(false)
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const { user } = useAuth();

    const navigate = useNavigate();

    const handleSubmit = async() => {
        setErrors([]);
        let sbWarnings = []
        if(user.role !== 'admin' && !organization) sbWarnings.push('You must select an organization to send this announcement to.')
        if(subject === '') sbWarnings.push('Please enter a subject.');
        if(body === '') sbWarnings.push('Please enter something in the body.');
        if(sbWarnings.length > 0){
            setErrors(sbWarnings);
            return;
        }
        try{
            setSaving(true);
            const data = {
                subject: subject,
                body: body,
                organization: organization?.id ||null,
                cascade_to_children: cascade,
            }
            if(project) data.project = id;
            const url = `/api/messages/announcements/`
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                navigate('/')
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
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record organization: ', err)
        }
        finally{
            setSaving(false)
        }

    }
    return(
        <div>
            {errors.length != 0 && <div role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <label htmlFor='subject'>Subject</label>
            <input id='subject' type='text' onChange={(e) => setSubject(e.target.value)} value={subject} />
            <label htmlFor='body'>Body</label>
            <textarea id='body' type='textarea' onChange={(e) => setBody(e.target.value)} value={body} />
            {!organization && user.role === 'admin' && <ModelSelect IndexComponent={ProjectsIndex} title={'To Project'} callback={(p) => setProject(p)} />}
            {organization && organization.child_organizations.length > 0 && <Checkbox name='cascade' label='Cascade to Children?' checked={cascade} callback={(c) => setCascade(c)} /> }
            <button onClick={() => handleSubmit()}>Send!</button>
        </div>
    )
}