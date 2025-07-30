import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ReturnLink from '../reuseables/ReturnLink';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import errorStyles from '../../styles/errors.module.css';
import styles from './narrative.module.css';

import { FaFolderOpen } from "react-icons/fa6";
import { MdCloudUpload } from "react-icons/md";
import { IoDocumentTextSharp } from "react-icons/io5";

export default function NarrativeReportUpload() {
    //params, uses project as root so id is project id and orgID is the specific org.
    //using parmas lets us avoid forcing the user to manually select
    const { id, orgID } = useParams();

    //uploaded file object
    const [file, setFile] = useState(null);
    //aditional file info
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');

    //page meta
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);

    //helper to upload the file
    const handleChange = (event) => setFile(event.target.files[0]);

    const fileInputRef = useRef();

    const handleFileSelection = () => {
        fileInputRef.current.click(); // trigger hidden file input
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setErrors([]);
        setSuccess('');

        //user should upload an actual file
        if (!file){
            setErrors(['Please select a file.']);
            setUploading(false);
            return 
        } 
        //should also have a title (description is optional)
        if (!title.trim()){
            setErrors(['Please enter a title for this upload.']);
            setUploading(false);
            return 
        } 

        //create and append object to a data mat
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
                setSuccess('File successfully uploaded!');
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

            {errors.length > 0 && <div className={errorStyles.errors}>
                <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
            </div>}

            {success && <div className={errorStyles.success}><p>{success}</p></div>}

            <div className={styles.template}>
                <form onSubmit={handleSubmit}  noValidate={true}>
                    <div className={styles.form}>
                        <label htmlFor="title">Upload Title</label>
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
                        {!file && <button onClick={handleFileSelection}  type="button" style={{ maxWidth: 140}}>
                            <FaFolderOpen />
                            Upload File
                        </button>}

                        {file && <button className={styles.selectedFile} type="button">
                            <div className={styles.selectedFileText}> <IoDocumentTextSharp /> {file.name}</div>
                        </button>}
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept=".pdf,.doc,.docx"
                            onChange={handleChange}
                        />
                    <div className={styles.buttons}>
                        {uploading ? 
                            <ButtonLoading /> : 
                            <ButtonHover noHover={<MdCloudUpload />} hover={'Upload Report'} />}
                        <button type="button" onClick={() => setFile(null)}>Clear</button>
                    </div>
                    </div>
                </form>
            </div>
        </div>
    );
}