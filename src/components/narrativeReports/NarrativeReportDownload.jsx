import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';

import errorStyles from '../../styles/errors.module.css';
import styles from './narrative.module.css';

import { FaCloudDownloadAlt, FaCloudUploadAlt } from "react-icons/fa";

//card that views/downloads a single report
function NarrativeReportCard({ report }){
    //page meta
    const [expanded, setExpanded] = useState(false);
    const[errors, setErrors] = useState([]);
    const [downloading, setDownloading] = useState(false); //sets loading state while downloading 

    //fetch and downloa the file
    const handleDownload = async (report) => {
        try {
            setDownloading(true);
            const response = await fetchWithAuth(`/api/uploads/narrative-report/${report.id}/download/`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            //this still seems kinda weird to me but it works so whatever
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
                {!expanded &&  <div onClick={(e) => e.stopPropagation()}><ButtonHover callback={() => handleDownload(report)} noHover={<FaCloudDownloadAlt />} hover={'Download File'}/></div>}
            </div>
            {expanded && 
                <div>
                    {report.descripton ? <p>{report.description}</p> : <p>No description</p>}
                    {downloading ? <ButtonLoading /> : <div onClick={(e) => e.stopPropagation()}><ButtonHover callback={() => handleDownload(report)} noHover={<FaCloudDownloadAlt />} hover={'Download File'}/></div>}
                </div>
            }
        </div>
    )
}

//index view for all reports, naturally segmented by project/org, meant to be used as a component within another page
export default function NarrativeReportDownload({ organization, project }) {
    //context
    const { user } = useAuth();

    //related file info
    const [files, setFiles] = useState([]);

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    

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
            <h3>Narrative Reports for {organization.name} during {project.name}</h3>

            {errors.length > 0 && <div className={errorStyles.errors}>
                <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
            </div>}

            <Link to={`/projects/${project.id}/organizations/${organization.id}/upload`} >
                <ButtonHover noHover={<FaCloudUploadAlt />} hover={'Upload New Document'} />
            </Link>

            {files.length > 0 ? files.map((report) => (
                <NarrativeReportCard report={report} />
            )) : <p>No reports yet. Come back later.</p>}
            
        </div>
    )
}