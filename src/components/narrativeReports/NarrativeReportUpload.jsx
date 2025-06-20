import { useAuth } from '../../contexts/UserAuth';
import { useState, useEffect, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import Loading from '../reuseables/Loading';
import errorStyles from '../../styles/errors.module.css';
import styles from './narrative.module.css';
import { useParams } from 'react-router-dom';

export default function NarrativeReportUpload() {
    const { id } = useParams();
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [file, setFile] = useState(null);
    const [targetOrg, setTargetOrg] = useState(user.organization_id || '');
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const getOrganizations = async () => {
            try {
                const response = await fetchWithAuth(`/api/organizations/`);
                const data = await response.json();
                setOrganizations(data.results || []);
            } catch (err) {
                setErrors(['Failed to fetch organizations.']);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        getOrganizations();
    }, []);

    const organizationIDs = useMemo(() => organizations.map(org => org.id), [organizations]);
    const organizationNames = useMemo(() => organizations.map(org => org.name), [organizations]);

    const handleChange = (event) => setFile(event.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setErrors([]);
        setSuccess('');

        if (!file){
            setErrors(['Please select a file.']);
            
            return 
        } 
        if (!title.trim()){
            setErrors(['Please enter a title for this upload.']);
            setUploading(false);
            return 
        } 

        const formData = new FormData();
        formData.append('file', file);
        formData.append('organization', targetOrg);
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
        setUploading(false)
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.fileUpload}>
            <h1>Upload a Narrative Report</h1>

            {errors.length > 0 && (
                <div className={errorStyles.errors}>
                    <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                </div>
            )}
            {success && <div className={errorStyles.success}><p>{success}</p></div>}

            <div className={styles.template}>
                <i>1. Select your organization and project, then upload your report.</i>
                <SimpleSelect
                    name="organization"
                    label="Select an Organization"
                    defaultOption={targetOrg}
                    optionValues={organizationIDs}
                    optionLabels={organizationNames}
                    callback={setTargetOrg}
                />
                <form onSubmit={handleSubmit}>
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
                        name="description"
                        id="description"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    />

                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleChange} />
                    <button type="submit" disabled={uploading}>Upload</button>
                    <button type="button" onClick={() => setFile(null)}>Clear</button>
                </form>
            </div>
        </div>
    );
}