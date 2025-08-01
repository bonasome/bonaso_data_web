import { useState, useEffect, useRef } from 'react';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ConflictManagerModal from './ConflictManagerModal'
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ModelSelect from '../reuseables/inputs/ModelSelect';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import ProjectsIndex from '../projects/ProjectsIndex';
import Messages from '../reuseables/Messages';

import styles from './batchRecord.module.css';

import { FaFileDownload } from "react-icons/fa";
import { FaFolderOpen } from "react-icons/fa6";
import { MdCloudUpload } from "react-icons/md";
import { IoDocumentTextSharp } from "react-icons/io5";

export default function BatchRecord(){
    //org and project for generating template
    const [org, setOrg] = useState(null);
    const [project, setProject] = useState(null);
    //the file itself
    const [file, setFile] = useState(null);
    //vars to manage conflicts that arrise from files
    const [conflict, setConflict] = useState(false);
    const [conflictList, setConflictList] = useState([]);

    //page meta
    const [warnings, setWarnings] = useState([]);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [gettingFile, setGettingFile] = useState(false);

    //auto scroll to aler
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //function to get a template
    const handleClick = async() => {
        setSuccess([]);
        setWarnings([]);
        setErrors([]);
        let getErrors = [];
        if(!project){
            getErrors.push('Please select a project.')
        }
        if(!org){
            getErrors.push('Please select an organization.')
        }
        if(getErrors.length > 0){
            setErrors(getErrors)
            return;
        }
        try{
            console.log('fetching template...');
            setGettingFile(true);
            const response = await fetchWithAuth(`/api/record/interactions/template/?project=${project.id}&organization=${org.id}`);
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
        finally{
            setGettingFile(false);
        }
    }

    //set the file
    const handleChange = (event) => {
        setFile(event.target.files[0]);
    };

    //helper ref to click the hiden file input
    const fileInputRef = useRef();
    const handleFileSelection = () => {
        fileInputRef.current.click(); // trigger hidden file input
    };


    //function to upload the template
    const handleSubmit = async (e) => {
        setWarnings([]);
        setSuccess([]);
        setErrors([]);

        e.preventDefault();
        if (!file) {
            setErrors(['Please select a file!'])
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try{
            setUploading(true);
            console.log('submitting file...')
            const response = await fetchWithAuth(`/api/record/interactions/upload/`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if(response.ok){
                if(data.errors.length == 0 && data.warnings.length ==0){
                    setSuccess(['Uploaded with no errors. Great work!']);
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

    return(
        <div className={styles.fileUpload}>
            <h1>Batch Uploading</h1>
            <Messages errors={errors} warnings={warnings} success={success} />
            {conflict && conflictList.length > 0 && <ConflictManagerModal existing={conflictList} handleClose={()=>setConflict(false)} />}
            
            <div className={styles.template}>

                <i>1. Select your organization and the project to get a ready to use template for recording data. There are directions and examples in the template for your reference.</i>
                    <ModelSelect IndexComponent={OrganizationsIndex} value={org} callbackText={'Choose Organization'}
                         onChange={setOrg} label={'Select an Organization'} labelField={'name'} />

                    <ModelSelect IndexComponent={ProjectsIndex} value={project} onChange={setProject}
                        label={'Select a Project'} callbackText={'Choose Project'}/>
                
                {gettingFile ? <ButtonLoading /> : 
                     <button onClick={() => handleClick()}><FaFileDownload /> Get my file!</button>}

            </div>
            
            <div className={styles.upload}>
                <i>2. Upload your completed file. If there are any issues, you will be informed and can try to upload again. </i>
                <form onSubmit={handleSubmit}  noValidate={true}>
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        <label htmlFor="upload_file">Select a file</label>
                        {!file && <button onClick={handleFileSelection}  type="button" style={{ maxWidth: 200}}>
                            <FaFolderOpen />
                            Select a file to upload
                        </button>}
                        {file && <button className={styles.selectedFile} type="button">
                            <div className={styles.selectedFileText}> <IoDocumentTextSharp /> {file.name}</div>
                        </button>}
                        
                        <input 
                            id="upload_file"
                            type="file" 
                            accept='.xlsx'
                            style={{ display: 'none' }} 
                            onChange={handleChange}
                            ref={fileInputRef}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {uploading ? <ButtonLoading /> :  <button type="submit">Submit Upload</button>}
                        <button
                            type="button"
                            onClick={() => {
                                setFile(null);
                                if (fileInputRef.current) {
                                fileInputRef.current.value = ''; // reset the actual input
                                }
                            }}
                            >
                            Clear
                        </button>
                    </div>
                </form>
            </div>
            <div className={styles.spacer}></div>

        </div>
    )
}