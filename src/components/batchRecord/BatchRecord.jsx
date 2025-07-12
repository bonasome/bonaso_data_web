import { useAuth } from '../../contexts/UserAuth';
import { useState, useEffect, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import Loading from '../reuseables/Loading';
import errorStyles from '../../styles/errors.module.css';
import styles from './batchRecord.module.css';
import ConflictManagerModal from './ConflictManagerModal'
import ButtonLoading from '../reuseables/ButtonLoading';

export default function BatchRecord(){
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [projectSearch, setProjectSearch] = useState('');
    const [orgSearch, setOrgSearch] = useState('');
    const [file, setFile] = useState(null);
    const [selectTools, setSelectTools] = useState({})
    const [targetOrg, setTargetOrg] = useState('');
    const [targetProject, setTargetProject] = useState('');
    const [loading, setLoading] = useState(true)
    const [warnings, setWarnings] = useState([]);
    const [errors, setErrors] = useState([]);
    const [ok, setOK] = useState(false)
    const [conflict, setConflict] = useState(false);
    const [conflictList, setConflictList] = useState([]);
    const [uploading, setUploading] = useState(false);
    
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    const [gettingFile, setGettingFile] = useState(false);
    useEffect(() => {
        const getProjects = async() => {
            try{
                console.log('fetching projects...')
                const response = await fetchWithAuth(`/api/manage/projects/?${projectSearch}`);
                const data = await response.json();
                setProjects(data.results)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
            }
        }
        getProjects();
    }, [projectSearch])

    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?${orgSearch}`);
                const data = await response.json();
                setOrganizations(data.results)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setLoading(false)
            }
        }
        getOrganizations();
    }, [orgSearch])

    useEffect(() => {
        const orgIDs = organizations?.map((o) => (o.id));
        const orgNames = organizations?.map((o) => (o.name))
        const pIDs = projects?.map((p) => (p.id))
        const pNames = projects?.map((p) => (p.name))
        setSelectTools({
             orgs: {
                names: orgNames,
                ids: orgIDs
             },
             projects: {
                names: pNames,
                ids: pIDs
             }
        })
    }, [projects, organizations])

    const handleClick = async() => {
        setWarnings([]);
        setErrors([]);
        let getErrors = [];
        if(targetProject === ''){
            getErrors.push('Please select a project.')
        }
        if(targetOrg === ''){
            getErrors.push('Please select an organization.')
        }
        if(getErrors.length > 0){
            setErrors(getErrors)
            return;
        }
        setGettingFile(true);
        try{
            console.log('fetching template...')
            const response = await fetchWithAuth(`/api/record/interactions/template/?project=${targetProject}&organization=${targetOrg}`);
            if(response.ok){
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = response.headers.get('Content-Disposition');
                const match = contentDisposition && contentDisposition.match(/filename="(.+)"/);
                const filename = match ? match[1] : 'template.xlsx';
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url)
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
                        serverResponse.push(`${msg}`);
                    });
                    } else {
                    serverResponse.push(`${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong, please try again.'])
            console.error('Failed to upload file: ', err);
        }
        setGettingFile(false);
    }

    const handleChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        setErrors([]);
        e.preventDefault();
        if (!file) {
            setErrors(['Please select a file!'])
            return;
        }

        const formData = new FormData();
        formData.append('file', file); // 'file' should match the key Django expects
        try{
            setUploading(true);
            console.log('submitting file...')
            const response = await fetchWithAuth(`/api/record/interactions/upload/`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if(response.ok){
                console.log(data)
                if(data.errors.length == 0 && data.warnings.length ==0){
                    setOK(true);
                }
                setErrors(data.errors);
                setWarnings(data.warnings);
                if(data.conflicts.length > 0) {
                    setConflict(true);
                    setConflictList(data.conflicts);
                }
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
                        serverResponse.push(`${msg}`);
                    });
                    } else {
                    serverResponse.push(`${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('File upload failed: ', err);
        }
        finally{
            setUploading(false);
        }
    }
    if (loading) return <Loading />
    return(
        <div className={styles.fileUpload}>
            <h1>Batch Uploading</h1>
            {errors.length != 0 && <div ref={alertRef} role='alert' className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {warnings.length != 0 && <div role='alert' className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {ok && <div className={errorStyles.success}><p>Upload successful!</p></div>}
            {conflict && conflictList.length > 0 && <ConflictManagerModal existing={conflictList} handleClose={()=>setConflict(false)} />}
            <div className={styles.template}>
                <i>1. Select your organization and the project to get a ready to use template for recording data. There are directions and examples in the template for your reference.</i>
                {selectTools?.orgs && <SimpleSelect name={'organization'} label={'Select an Organization'} 
                    optionValues={selectTools.orgs.ids} optionLabels={selectTools.orgs.names}
                    callback={(val)=>setTargetOrg(val)} search={true} searchCallback={(val) => setOrgSearch(val)}
                    />}
                {selectTools?.projects && <SimpleSelect name={'project'} label={'Select a Project'} 
                    optionValues={selectTools.projects.ids} optionLabels={selectTools.projects.names}
                    callback={(val)=>setTargetProject(val)} search={true} searchCallback={(val) => setProjectSearch(val)}
                    />}
                {gettingFile ? <ButtonLoading /> :  <button onClick={() => handleClick()}>Get my file!</button>}
            </div>
            
            <div className={styles.upload}>
                <i>2. Upload your completed file. If there are any issues, you will be informed and can try to upload again. </i>
                <form onSubmit={handleSubmit}  noValidate={true}>
                    <label htmlFor="upload_file">Upload file</label>
                    <input id="upload_file" type="file" onChange={handleChange} />
                    {uploading ? <ButtonLoading /> :  <button type="submit">Upload</button>}
                    <button type="button" onClick={() => setFile(null)}>Clear</button>
                </form>
            </div>
            <div className={styles.spacer}></div>

        </div>
    )
}