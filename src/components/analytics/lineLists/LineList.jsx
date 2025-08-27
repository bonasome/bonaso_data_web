import { useState, useEffect } from 'react';
import countries from 'world-countries';

import cleanLabels from '../../../../services/cleanLabels';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import Messages from '../../reuseables/Messages';
import ComponentLoading from "../../reuseables/loading/ComponentLoading";
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import LineListSettings from './LineListSettings';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';

import styles from './ll.module.css';

import { IoSettingsSharp } from "react-icons/io5";
import { FaTrashAlt } from 'react-icons/fa';
import { PiFileCsvFill } from "react-icons/pi";


export default function LineList({ id, onUpdate, onDelete, breakdowns }){
    /*
    Displays a tablular line list that can be downloaded.
    - id (integer): The id of the line list to be dispayed
    - onUpdate (function): Function to handle update to the settings
    - onDelete (function): What to do when deleting the line list
    - breakdowns (object): A map of labels/values that is used to convert db values to readable labels
    */
    const [list, setList] = useState(null); //the line list object
    //meta
    const [editing, setEditing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false);
    const [downloading, setDownloading] = useState(false); //state for managing when a download is ongoing

    //get the line list details
    const getLL = async() => {
        try {
            console.log('fetching line list...');
            const url = `/api/analysis/lists/${id}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if(response.ok){
                setList(data);
            }
            else{
                console.error(data);
                setErrors(['Something went wrong. Please try again later.'])
            }
        } 
        catch (err) {
            console.error('Failed to get meta:', err);
            setErrors(['Something went wrong. Please try again later.'])
        } 
    }

    //load the line list details once on load
    useEffect(() => {
        const initialLoad = async() => {
            await getLL();
            setLoading(false);
        }
        initialLoad();
    }, []);

    //download the line list as a csv file
    const handleDownload = async () => {
        try {
            setDownloading(true); //prevent multiple downloads
            const response = await fetchWithAuth(`/api/analysis/lists/${id}/download/`);
            
            //jargon for downloading the file
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'list.csv';
            if (disposition && disposition.includes('filename=')) {
                filename = disposition
                    .split('filename=')[1]
                    .replace(/['"]/g, '') // remove quotes
                    .trim();
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } 
        catch (error) {
            setErrors(['Failed to download data. Please try again later.']);
            console.error('Download failed:', error);
        }
        finally {
            setDownloading(false);
        }
    };

    //handle deleting the line list
    const handleDelete = async() => {
        try {
            console.log('deleting line list...');
            const response = await fetchWithAuth(`/api/analysis/lists/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(id); //if ok, run onDelete to update the parent component
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
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse); //else alert the user
            }
        } 
        catch (err) {
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete pivot table:', err);
        }
        finally{
            setDel(false);
        }
    }

    //set the headers as the keys for the first list item (since they should all be the same structure)
    const headers = list?.data.length > 0 ? Object.keys(list?.data[0]) : [];
    const rows = list?.data;

    //function for taking a cell and cleaning it
    const cleanCell = (cell, col) => {
        //these ones are already in good shape
        if(['indicator', 'organization', 'project', 'numeric_component', 'subcategory'].includes(headers[col])) return cell;
        //clean up dates
        if(['dob', 'interaction_date'].includes(headers[col])) return prettyDates(cell);
        //get full country name for citizenship (db stores 2 digit code)
        if(headers[col] === 'citizenship'){
            const country = countries.find(c => c.cca2 === cell.toUpperCase());
            return country ? country.name.common : null;
        }
        //convert booleans
        if(cell === true) return 'True';
        if(cell === false) return 'False';
        //if an array, join the array in a readable format
        if(Array.isArray(cell)){
            let cat = headers[col]
            if(cat == 'kp_status') cat = 'kp_type';
            if(cat == 'disability_status') cat='disability_type';
            return cell.map(c => (breakdowns?.[cat]?.[c] ?? 
                (typeof(c) === 'string' ? cleanLabels(c) : c))).join(', ')
        }
        //try to find it in the map
        return breakdowns?.[headers[col]]?.[cell] ?? 
            (typeof(cell) === 'string' ? cleanLabels(cell) : cell)
    }

    if(loading) return <ComponentLoading />
    return(
        <div>
            {del && <ConfirmDelete name={'this line list'} onCancel={() => setDel(false)} onConfirm={handleDelete} allowEasy={true} /> }
            {editing && <LineListSettings existing={list} onUpdate={(data) => {getLL(); onUpdate(data)}} onClose={() => setEditing(false)} />}
            <div className={styles.segment}>
                <h1>{list.name}</h1>
                <Messages errors={errors} />
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <ButtonHover callback={() => setEditing(true)} noHover={<IoSettingsSharp />} hover='Edit Line List' />
                    {downloading ? <ButtonLoading /> : 
                    <ButtonHover callback={() => handleDownload()} noHover={<PiFileCsvFill />} hover={'Download as CSV'} />}
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover='Delete Line List' forDelete={true} />
                </div>
            </div>

            <div className={styles.table}>
            {list?.data?.length > 0 ? <div>
                <h2>Parameters</h2>
                {/* Display the users selected filters/params */}
                {list.start && <p>From {prettyDates(list.start)} {list.end && `to ${prettyDates(list.end)}`}</p>}
                {list.indicator && <p><strong>Indicator: </strong> {list.indicator.display_name}</p>}
                {list.project && <p><strong>Project: </strong> {list.project.name}</p>}
                {list.organization && <p><strong>Organization: </strong> {list.organization.name} {list.cascade_organization && '(and subgrantees)'}</p>}
                <table>
                    <thead>
                        <tr>
                            {headers.map(h => (
                                <th key={h}>{cleanLabels(h)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.values(r).map((cell, columnIndex) => (
                                    <td key={`${rowIndex}__${columnIndex}`}>{cleanCell(cell, columnIndex)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> : <p>No data for this list</p>}
            </div>
        </div>
    )
}