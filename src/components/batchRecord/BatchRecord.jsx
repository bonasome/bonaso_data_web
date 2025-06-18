import { useAuth } from '../../contexts/UserAuth';
import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import Loading from '../reuseables/Loading';

export default function BatchRecord(){
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [file, setFile] = useState(null);
    const [selectTools, setSelectTools] = useState({})
    const [targetOrg, setTargetOrg] = useState(user.organization);
    const [targetProject, setTargetProject] = useState('');
    const [loading, setLoading] = useState(true)

    const [gettingFile, setGettingFile] = useState(false);
    useEffect(() => {
        const getProjects = async() => {
            try{
                console.log('fetching projects...')
                const response = await fetchWithAuth(`/api/manage/projects/`);
                const data = await response.json();
                setProjects(data.results)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
            }
        }
        getProjects();
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/`);
                const data = await response.json();
                console.log(data.results)
                setOrganizations(data.results)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setLoading(false)
            }
        }
        getOrganizations();
    }, [])

    useEffect(() => {
        const orgIDs = organizations.map((o) => (o.id));
        const orgNames = organizations.map((o) => (o.name))
        const pIDs = projects.map((p) => (p.id))
        const pNames = projects.map((p) => (p.name))
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
        }
        catch(err){
            console.error('Failed to fetch projects: ', err);
        }
        setGettingFile(false);
    }

    const handleChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file); // 'file' should match the key Django expects
        console.log(file)
        try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/record/interactions/upload/`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                console.log(data.results)
                setOrganizations(data.results)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
            }
    }
    if (loading) return <Loading />
    return(
        <div>
            {selectTools?.orgs && <SimpleSelect name={'organization'} label={'Select an Organization'} 
                optionValues={selectTools.orgs.ids} optionLabels={selectTools.orgs.names}
                defaultOption={targetOrg} callback={(val)=>setTargetOrg(val)} />}
            {selectTools?.projects && <SimpleSelect name={'project'} label={'Select an Project'} 
                optionValues={selectTools.projects.ids} optionLabels={selectTools.projects.names}
                defaultOption={targetProject} callback={(val)=>setTargetProject(val)} />}
            <button onClick={() => handleClick()} disabled={gettingFile}>Get my file!</button>

            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleChange} />
                <button type="submit">Upload</button>
            </form>

            <p>This page allows you to download a template, fill it out, and then upload it.</p>
        </div>
    )
}