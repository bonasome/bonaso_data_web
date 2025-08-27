import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ReturnLink from '../reuseables/ReturnLink';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import Messages from '../reuseables/Messages';

import errorStyles from '../../styles/errors.module.css';
import styles from './narrative.module.css';

import { FaFolderOpen } from "react-icons/fa6";
import { MdCloudUpload } from "react-icons/md";
import { IoDocumentTextSharp } from "react-icons/io5";

export default function NarrativeReportUpload() {
    /*
    Allows the user to upload a narrative report. Requires an organization ID and a project ID to be
    passed as URL params to give the component the necessary information.
    */
    const { id, orgID } = useParams(); //id is project ID

    //user selected file object
    const [file, setFile] = useState(null);

    //aditional file info
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    //page meta
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [uploading, setUploading] = useState(false); //user is uploading a file

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((errors.length > 0 || success.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors, success]);

    //helper to upload the file
    const handleChange = (event) => setFile(event.target.files[0]);

    // trigger hidden file input, so that we can use custom styling
    const fileInputRef = useRef();
    const handleFileSelection = () => {
        fileInputRef.current.click(); 
    };

    //handle submission of file upload form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setErrors([]);
        setSuccess([]);

        let submissionErrors = []
        //user should upload an actual file
        if (!file){
            submissionErrors.push('Please select a file to upload.')
        } 
        //should also have a title (description is optional)
        if (!title.trim()){
            submissionErrors.push('Title is required.')
        } 
        if(submissionErrors.length > 0){
            setErrors(submissionErrors);
            setUploading(false);
            return 
        }

        //create and append object to a data map
        const formData = new FormData();
        formData.append('file', file);
        formData.append('organization', orgID);
        formData.append('project', id);
        formData.append('title', title);
        formData.append('description', desc);

        try {
            console.log('uploading file...')
            const response = await fetchWithAuth(`/api/uploads/narrative-report/`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setSuccess(['File successfully uploaded!']);
                setTitle('');
                setDesc('');
                setFile(null);
            } else {
                const data = await response.json();
                if (data?.detail) setErrors([data.detail]);
                else setErrors(['Upload failed.']);
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            setErrors(['Something went wrong. Please try again later.']);
        }
        finally{
            setUploading(false)
        }
        
    };

    return (
        <div className={styles.fileUpload}>
            <ReturnLink url={`/projects/${id}/organizations/${orgID}`} display={'Return to organization page'} />
            
            <h1>Upload a Narrative Report</h1>

            <Messages errors={errors} success={success} ref={alertRef} />

            <div className={styles.template}>
                <form onSubmit={handleSubmit}  noValidate={true}>
                    <div className={styles.form}>
                        <label htmlFor="title">Upload Title (Required)</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />

                        <label htmlFor="description">Upload Description</label>
                        <textarea
                            className={styles.desc}
                            name="description"
                            id="description"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                        />
                        
                        {/* the user sees this buttom, which when clicked triggers the hidden file input */}
                        {!file && <button onClick={handleFileSelection}  type="button" style={{ maxWidth: 140}}>
                            <FaFolderOpen />
                            Upload File
                        </button>}
                        {/* if a file is selected, display the file name */}
                        {file && <button className={styles.selectedFile} type="button">
                            <div className={styles.selectedFileText}> <IoDocumentTextSharp /> {file.name}</div>
                        </button>}
                        {/* the actual file input is hidden */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept=".pdf,.doc,.docx"
                            onChange={handleChange}
                        />
                    <div className={styles.buttons}>
                        {uploading ? <ButtonLoading /> : 
                            <button type="submit"><MdCloudUpload /> Upload File</button>}
                        <button type="button" onClick={() => setFile(null)}>Clear</button>
                    </div>
                    </div>
                </form>
            </div>
        </div>
    );
}