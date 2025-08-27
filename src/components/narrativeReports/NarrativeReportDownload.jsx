import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Messages from '../reuseables/Messages';
import IndexViewWrapper from '../reuseables/IndexView';
import ConfirmDelete from '../reuseables/ConfirmDelete';

import styles from './narrative.module.css';

import { FaCloudDownloadAlt, FaCloudUploadAlt, FaTrashAlt } from "react-icons/fa";

function NarrativeReportCard({ report, onDelete }){
    /*
    Card used to view or download a single report. 
    - report (object): the report in question
    - onDelete (function): what to do if the report is deleted
    */

    const { user } = useAuth();
    //page meta
    const [del, setDel] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);
    const [downloading, setDownloading] = useState(false); //sets loading state while downloading 

    //fetch and download the file
    const handleDownload = async (report) => {
        try {
            setDownloading(true);
            const response = await fetchWithAuth(`/api/uploads/narrative-report/${report.id}/download/`);

            //file downloading jargon
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

    //handle file deletion
    const handleDelete = async() => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/uploads/narrative-report/${report.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(); //tell parent the file was deleted
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } 
                    else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete report:', err);
            setErrors(['Something went wrong. Please try again later.']);
        }
        finally{
            setDel(false);
        }
    } 
    //return confirm delete modal as a seperate component since the hover features messes with modal styles
    if(del) return <ConfirmDelete name={`Upload ${report.title}`} onCancel={() => setDel(false)} onConfirm={handleDelete} />
    return(
        <div key={report.id} className={styles.card} onClick={() => setExpanded(!expanded)}>
            <Messages errors={errors} />
            <div className={styles.downloadRow}>
                <h3>{report.title}</h3>
                {!expanded &&  <div onClick={(e) => e.stopPropagation()}><ButtonHover callback={() => handleDownload(report)} noHover={<FaCloudDownloadAlt />} hover={'Download File'}/></div>}
            </div>
            {expanded && 
                <div>
                    {report.descripton ? <p>{report.description}</p> : <p>No description</p>}
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {downloading ? <ButtonLoading /> : <div onClick={(e) => e.stopPropagation()}><ButtonHover callback={() => handleDownload(report)} noHover={<FaCloudDownloadAlt />} hover={'Download File'}/></div>}
                        {!['client'].includes(user.role) && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Upload'} forDelete={true} />}
                    </div>
                </div>
            }
        </div>
    )
}


export default function NarrativeReportDownload({ organization, project }) {
    /*
    Index view that displays all narative reports for a project/organization pair
    - organization (object): The organization to get narrative reports about
    - project (object): the project to get narrative reports about
    */
    //context
    const { user } = useAuth();

    //array of reports
    const [files, setFiles] = useState([]);

    //index helpers
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [search, setSearch] = useState('');

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [deleted, setDeleted] = useState([]); //temp array to store deleted ids until api is called again
    
    //get the files
    useEffect(() => {
        const getFiles = async () => {
            try {
                //filter to this project/organization  specifically
                const response = await fetchWithAuth(`/api/uploads/narrative-report/?project=${project.id}&organization=${organization.id}&search=${search}&page=${page}`);
                const data = await response.json();
                setFiles(data.results);
                setEntries(data.count);
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
    }, [organization, project, search, page]);

    if (loading) return <ComponentLoading />;
    const validFiles = files?.filter(f => (!deleted.includes(f?.id))); //filter deleted files until the api is called again
    
    return (
        <div className={styles.files}>
            <h3>Narrative Reports for {organization.name} during {project.name}</h3>
            <Messages errors={errors} />
            <IndexViewWrapper page={page} entries={entries} onSearchChange={setSearch} onPageChange={setPage}>
                {!['client'].includes(user.role) && <Link to={`/projects/${project.id}/organizations/${organization.id}/upload`} >
                    <ButtonHover noHover={<FaCloudUploadAlt />} hover={'Upload New Document'} />
                </Link>}
                {validFiles.length > 0 ? validFiles.map((report) => (
                    <NarrativeReportCard report={report} onDelete={() => setDeleted(prev => [...prev, report.id])} />
                )) : <p>No reports yet. Check back later.</p>}
            </IndexViewWrapper>
        </div>
    )
}