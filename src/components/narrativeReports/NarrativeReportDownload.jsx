import { useAuth } from '../../contexts/UserAuth';
import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import ComponentLoading from '../reuseables/ComponentLoading';
import errorStyles from '../../styles/errors.module.css';
import styles from './narrative.module.css';
import { Link } from 'react-router-dom';
import ButtonLoading from '../reuseables/ButtonLoading';

function NarrativeReportCard({ report }){
    const [expanded, setExpanded] = useState(false);
    const[errors, setErrors] = useState([]);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (report) => {
        try {
            setDownloading(true);
            const response = await fetchWithAuth(`/api/uploads/narrative-report/${report.id}/download/`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', report.file?.split('/').pop() || 'report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } 
        catch (error) {
            setErrors(['Failed to download file.']);
            console.error('Download failed:', error);
        }
        finally{
            setDownloading(false);
        }
    };
    return(
        <div key={report.id} className={styles.card} onClick={() => setExpanded(!expanded)}>
            {errors.length > 0 && (
                <div className={errorStyles.errors}>
                    <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                </div>
            )}
            <div className={styles.downloadRow}>
                <h3>{report.title}</h3>
                {!expanded && downloading ? <ButtonLoading />  : <button onClick={() => handleDownload(report)}>Download</button>}
            </div>
            {expanded && 
                <div>
                    <p>{report.description}</p>
                    {downloading ? <ButtonLoading /> : <button onClick={() => handleDownload(report)}>Download</button>}
                </div>
            }
        </div>
    )
}

export default function NarrativeReportDownload({ organization, project }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [files, setFiles] = useState([]);
    useEffect(() => {
        const getFiles = async () => {
            try {
                const response = await fetchWithAuth(`/api/uploads/narrative-report/?project=${project.id}&organization=${organization.id}`);
                const data = await response.json();
                setFiles(data.results || []);  // assuming paginated API
            } 
            catch (error) {
                setErrors(['Failed to load reports.']);
                console.error('Fetch failed:', error);
            } 
            finally {
                setLoading(false);
            }
        };
        getFiles();
    }, [organization, project]);

    if (loading) return <ComponentLoading />;

    return (
        <div className={styles.files}>
            <h2>Narrative Reports for {organization.name} during {project.name}</h2>

            {errors.length > 0 && (
                <div className={errorStyles.errors}>
                    <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                </div>
            )}

            {files.length > 0 ? files.map((report) => (
                <NarrativeReportCard report={report} />
            )) : <p>No reports found.</p>}
            {files.length == 0 && <p>No narrative reports have been uploaded yet.</p>}
            {!['client'].includes(user.role) && <Link to={`/projects/${project.id}/organizations/${organization.id}/upload`} ><button>Upload a Narrative Report for this Project</button></Link>}
        </div>
    )
}