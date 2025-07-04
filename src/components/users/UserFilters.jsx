import React from 'react';
import styles from '../../styles/filters.module.css';
import errorStyles from '../../styles/errors.module.css'
import { useEffect, useState, useRef, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import SimpleSelect from '../reuseables/SimpleSelect';
import { FaFilter } from "react-icons/fa6";
import Checkbox from '../reuseables/Checkbox';
import ComponentLoading from '../reuseables/ComponentLoading';
import { useProfiles } from '../../contexts/ProfilesContext';
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { useProjects } from '../../contexts/ProjectsContext';

export default function ProfileFilters({ onFilterChange }){
    const [loading, setLoading] = useState(true);
    const {organizations, setOrganizations } = useOrganizations();
    const { projectsMeta, setProjectsMeta } = useProjects();
    const { profilesMeta, setProfilesMeta } = useProfiles();
    const [orgSearch, setOrgSearch] = useState('');
    const [selectTools, setSelectTools] = useState({});
    const [filters, setFilters] = useState({
        role: '',
        organization: '',
        client_organization: '',
        inactive: false,
    });
    const [showFilters, setShowFilters] = useState(false);
    const containerRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const getProfilesMeta = async() => {
            if(Object.keys(profilesMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/profiles/users/meta/`);
                    const data = await response.json();
                    setProfilesMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch profiles meta: ', err)
                }
            }
        }
        getProfilesMeta();
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                }
            }
        }
        getProjectMeta();
    }, [])

    useEffect(() => {
        const getOrganizations = async () => {
            try{
                console.log('fetching organizations...')
                const response = await fetchWithAuth(`/api/organizations/?${orgSearch}`);
                const data = await response.json();
                setOrganizations(data.results)
                setLoading(false)
            }
            catch(err){
                console.error('Failed to fetch projects: ', err);
                setLoading(false)
            }
        }
        getOrganizations();
    }, [orgSearch]);

    useEffect(() => {
        const orgIDs = organizations?.map((o) => (o.id));
        const orgNames = organizations?.map((o) => (o.name));

        const clientIDs = data.clients.map((c) => c.id);
        const clientNames= data.clients.map((c)=> c.name);

        setSelectTools({
            orgs: {
            names: orgNames,
            ids: orgIDs
            },
            clients: {
            names: clientNames,
            ids: clientIDs
            },  
        })
    }, [projectsMeta, organizations]);



    const handleChange = () =>{
        onFilterChange(filters);
    }

    const clearFilter = () => {
        setFilters({
            role: '',
            organization: '',
            client_organization: '',
            inactive: false,
        })
        onFilterChange({
            role: '',
            organization: '',
            client_organization: '',
            inactive: false,
        })
    }

    if(loading) return <ComponentLoading />
    return (
        <div className={styles.filterContainer} ref={containerRef}>
            <button onClick={() => setShowFilters(!showFilters)}>
                <FaFilter />
            </button>
            {showFilters && (
                <div className={styles.filters}>
                    <SimpleSelect
                        name='role'
                        defaultOption={''}
                        value={filters.role}
                        optionValues={profilesMeta.roles}
                        optionLabels={profilesMeta.role_labels}
                        callback={(val) => setFilters(prev => ({...prev, role: val}))}
                    />
                    {['admin'].includes(user.role) && <SimpleSelect
                        name='client'
                        optionValues={selectTools.clients.ids} value={filters.client_organization}
                        optionLabels={selectTools.clients.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, client: val}))}
                    />}
                    
                    <SimpleSelect
                        name='organization'
                        label='Organization'
                        optionValues={selectTools.orgs.ids} value={filters.organization}
                        optionLabels={selectTools.orgs.names} search={true}
                        callback={(val) => setFilters(prev => ({...prev, organization: val}))}
                    />
                    <Checkbox label={'Inactive User'} checked={filters.inactive} name={'active'} callback={(checked) => setFilters(prev => ({...prev, inactive: checked}))}/>
                    <button onClick={()=>handleChange()}>Apply</button>
                    <button onClick={clearFilter}>Clear</button>
                </div>
            )}
        </div>
    );
}
