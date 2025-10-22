import { useState, useEffect, useRef } from 'react';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ConflictManagerModal from './ConflictManagerModal'
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ModelSelect from '../reuseables/inputs/ModelSelect';
import ModelMultiSelect from '../reuseables/inputs/ModelMultiSelect';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import Tasks from '../tasks/Tasks';
import Messages from '../reuseables/Messages';

import styles from './batchRecord.module.css';

import { FaFileDownload } from "react-icons/fa";
import { FaFolderOpen } from "react-icons/fa6";
import { MdCloudUpload } from "react-icons/md";
import { IoDocumentTextSharp } from "react-icons/io5";

export default function BatchRecord(){
    /*
    Component for getting/uploading Excel templates for a project/organization that can be filled out and 
    then uploaded into the system. 
    */

    //org and project for generating template
    const [org, setOrg] = useState(null);
    const [task, setTask] = useState([]);

    //the file itself
    const [file, setFile] = useState(null);

    //vars to manage conflicts that arrise from files
    const [conflict, setConflict] = useState(false);
    const [conflictList, setConflictList] = useState([]);

    //page meta
    const [warnings, setWarnings] = useState([]);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [uploading, setUploading] = useState(false); //file is being uploaded
    const [gettingFile, setGettingFile] = useState(false); //template is being downloaded

    //auto scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((errors.length > 0 || success.length > 0 || warnings.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors, success, warnings]);

    //function to get a template
    const handleClick = async() => {
        setSuccess([]);
        setWarnings([]);
        setErrors([]);

        //make sure a project/organization is selected
        let getErrors = [];
        if(!task){
            getErrors.push('Please select a task.')
        }
        if(!org){
            getErrors.push('Please select an organization.')
        }
        if(getErrors.length > 0){
            setErrors(getErrors)
            return;
        }
        try{
            setGettingFile(true);
            const response = await fetchWithAuth(`/api/record/interactions/template/`, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'organization_id': org.id,
                    'task_id': task.id,
                })
            });
            if(response.ok){
                //file download jargon
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

    //set the file on select
    const handleChange = (event) => {
        setFile(event.target.files[0]);
    };

    //helper ref to click the hidden file input (so we can restyle it)
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
                //if there are conflicts, display the conflict manager modal
                if(data.conflicts.length > 0) {
                    setConflict(true);
                    setConflictList(data.conflicts);
                }
            }
            else {
                try {
                    console.error(data);
                    setErrors(data?.errors);
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
            <Messages errors={errors} warnings={warnings} success={success} ref={alertRef} />
            {conflict && conflictList.length > 0 && <ConflictManagerModal conflicts={conflictList} onClose={()=>setConflict(false)} />}
            
            <div className={styles.template}>
                <p>
                    Use this page to get Excel templates for an assessment. After filling out the template,
                    you can then upload that template right here as well and the data will appear in our system.
                    Easy as that.
                </p>
            </div>
            <div className={styles.template}>
                <p><i>1. Select your organization and the project to get a ready-to-use template for recording data. There are directions and examples in the template for your reference.</i></p>
                <p><strong>Please make sure you review the "tutorial" worksheet before collecting data!</strong></p>
                    <ModelSelect name={'organization'} IndexComponent={OrganizationsIndex} value={org} callbackText={'Choose Organization'}
                         onChange={setOrg} label={'Select an Organization'} labelField={'name'} />

                    {org && <ModelSelect name={'assessment(s)'} IndexComponent={Tasks} value={task} onChange={setTask}
                        label={'Select a Assessment(s) to Include'} labelField='display_name' includeParams={[{field: 'organization', value: org?.id}, {field: 'category', value: 'assessment' }]}/>}
                
                {gettingFile ? <ButtonLoading /> : 
                     <button onClick={() => handleClick()}><FaFileDownload /> Get my file!</button>}

            </div>
            
            <div className={styles.upload}>
                <p><i>2. Upload your completed file. If there are any issues, you will be informed and can try to upload again. </i></p>
                <p><strong>Please make sure you are only uploading templates that you got from this site!</strong></p>
                <p><strong>Also, please check for any error messages you receive after uploading. They may have important information about things you need to correct before your data is uploaded.</strong></p>
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