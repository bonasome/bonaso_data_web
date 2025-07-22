import { useAuth } from '../../contexts/UserAuth';
import { useState, useEffect, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import errorStyles from '../../styles/errors.module.css';
import styles from './narrative.module.css';
import { useParams, Link } from 'react-router-dom';
import ButtonLoading from '../reuseables/ButtonLoading';
import { IoMdReturnLeft } from "react-icons/io";
import { MdCloudUpload } from "react-icons/md";
import ButtonHover from '../reuseables/ButtonHover';

export default function NarrativeReportUpload() {
    const { id, orgID } = useParams();
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleChange = (event) => setFile(event.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setErrors([]);
        setSuccess('');

        if (!file){
            setErrors(['Please select a file.']);
            setUploading(false);
            return 
        } 
        if (!title.trim()){
            setErrors(['Please enter a title for this upload.']);
            setUploading(false);
            return 
        } 

        const formData = new FormData();
        formData.append('file', file);
        formData.append('organization', orgID);
        formData.append('project', id);
        formData.append('title', title);
        formData.append('description', desc);

        try {
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

    if (loading) return <Loading />;
    return (
        <div className={styles.fileUpload}>
            <Link to={`/projects/${id}/organizations/${orgID}`} className={styles.return}>
                <IoMdReturnLeft className={styles.returnIcon} />
                <p>Return to projects overview</p>   
            </Link>
            <h1>Upload a Narrative Report</h1>

            {errors.length > 0 && (
                <div className={errorStyles.errors}>
                    <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                </div>
            )}
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

                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleChange} />
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