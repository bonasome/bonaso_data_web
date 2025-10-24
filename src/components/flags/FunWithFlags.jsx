import React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';

import { useAuth } from '../../contexts/UserAuth'

import fetchWithAuth from '../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';

import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import Filter from '../reuseables/Filter';
import Messages from '../reuseables/Messages';
import FlagCard from './FlagCard';
import Metadata from './metadata/Metadata';

import styles from '../../styles/indexView.module.css'

import { IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";

//doubles as a flag index component and a data quality overview
export default function FunWithFlags(){
    /*
    A component which both serves as an index component for a users flags and also displays some metadata about 
    their flags.
    */

    //contexts
    const [flags, setFlags] = useState([]); //array of a users flags
    const [metadata, setMetadata] = useState(null); //meta information about their flags
    const [meta, setMeta] = useState(null); //model information
    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMetadata, setShowMetadata] = useState(true); //expand/contract the metadata section
    //information for indexing
    const [filters, setFilters] = useState(initial);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0); //total number of entries for calculating number of pages

    //filter helpers
    const [orgs, setOrgs] = useState([]); //for constructing org filter select
    const [orgSearch, setOrgSearch] = useState(''); //allows user to search orgs via the api (due to pagination)

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    console.log(flags)
    //retrieve the meta
    useEffect(() => {
        const getMeta = async() => {
            try {
                console.log('fetching meta...')
                const url = `/api/flags/meta/`;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setMeta(data);
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong. Plese try again later.'])
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        }
        getMeta();
    }, []);


    //load the list of indicators, refresh on search/filter/page changes
    useEffect(() => {
        const loadFlags = async () => {
            try {
                console.log('fetching flags...');
                //convert filters object to URL params
                const filterQuery = 
                    (filters.start ? `&start=${filters.start}` : '') + 
                    (filters.end ? `&end=${filters.end}` : '') + 
                    (filters.auto ? `&auto_flagged=${filters.auto}` : '') + 
                    (filters.resolved ? `&resolved=${filters.resolved}` : '') + 
                    (filters.model ? `&model=${filters.model}` : '') + 
                    (filters.reason ? `&reason_type=${filters.reason}` : '') + 
                    (filters.organization ? `&organization=${filters.organization}` : '');

                const url = `/api/flags/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setFlags(data.results);
                
            } 
            catch (err) {
                console.error(err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        };
        loadFlags();
    }, [page, search, filters]);

    //fetch the metadata about flags (and have it respond to filters)
    useEffect(() => {
        const loadMetadata = async () => {
            try{
                console.log('fetching metadata...')
                //convert filters object to URL params
                const filterQuery = 
                    (filters.start ? `&start=${filters.start}` : '') + 
                    (filters.end ? `&end=${filters.end}` : '') + 
                    (filters.auto ? `&auto_flagged=${filters.auto}` : '') + 
                    (filters.resolved ? `&resolved=${filters.resolved}` : '') + 
                    (filters.model ? `&model=${filters.model}` : '') + 
                    (filters.reason ? `&reason_type=${filters.reason}` : '') + 
                    (filters.organization ? `&organization=${filters.organization}` : '');
                const urlMeta = `/api/flags/metadata/?search=${search}&page=${page}` + filterQuery;
                const metaResponse = await fetchWithAuth(urlMeta);
                const metadataData = await metaResponse.json();
                setMetadata(metadataData);
            }
            catch(err){
                console.error(err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        }
        loadMetadata();
    }, [filters]);

    //fetch an array of organizations for the filter
    useEffect(() => {
        const loadOrgs = async () => {
            try {
                const url = `/api/organizations/?search=${search}`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setOrgs(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch organizations: ', err)
                setErrors(['Something went wrong, Please try again later.']);
            }
            finally {
                setLoading(false);
            }
        };
        loadOrgs();
    }, [orgSearch]);

    //what to do when a flag is resolved or updated
    const updateFlag = (flag) => {
        const others = flags.filter((f) => f?.id != flag?.id);
        setFlags([...others, flag]);
    }

    if(loading || !metadata) return <Loading />
    return(
        <div className={styles.index}>
            <h1>Your Flags</h1>
            <Messages errors={errors} ref={alertRef} />
            <p>
                This is a place where you can view all of your flags. These are notes telling you that 
                you may need to review some information. Some flags are automatically generated by the system,
                others may be raised by other users. Please carefully review any active flags, and either fix
                the error causing them or give a reason for resolving them. 
            </p>
            <p><strong>While an item is flagged, it will not contribute towards your targets or be counted when looking at dashboards or pivot tables.</strong></p>
            <div className={styles.dropdownSegment}>
                <div className={styles.toggleDropdown} onClick={() => setShowMetadata(!showMetadata)}>
                    <h3 style={{ textAlign: 'start'}}>Flag Metadata</h3>
                    {showMetadata ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>

                {showMetadata && <Metadata metadata={metadata} />}
            </div>
            
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} 
                filter={<Filter onFilterChange={(input) => {setFilters(input); setPage(1)}} config={filterConfig(meta, orgs, (s) => setOrgSearch)} initial={initial} />}
            >
                <h2>All Flags</h2>
                {flags?.length === 0 ? 
                    <p>Phew. No flags. Keep checking though.</p> :
                    flags.map(f => (
                        <FlagCard flag={f} index={true} onUpdate={(flag) => updateFlag(flag)} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}