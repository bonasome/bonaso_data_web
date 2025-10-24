import { useState, useEffect } from 'react';

import cleanLabels from '../../../../services/cleanLabels';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';
import { AGE_ORDER } from '../../../../services/ageRanges';

import Messages from '../../reuseables/Messages';
import ComponentLoading from "../../reuseables/loading/ComponentLoading";
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import PivotTableSettings from './PivotTableSettings';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';

import styles from './pt.module.css';

import { IoSettingsSharp } from "react-icons/io5";
import { FaTrashAlt } from 'react-icons/fa';
import { PiFileCsvFill } from "react-icons/pi";


export default function PivotTable({ id, breakdowns, onUpdate, onDelete, meta }){
    /*
    Displays a single pivot table with the option to download it as a csv.
    - id (integer): the id of the pivot table
    - breakdowns (object): the map of db values and labels to create readable labels
    - onUpdate (function): handle edits to settings
    - onDelete (function): handle deleting the table
    - meta (object): model information
    */

    const [table, setTable] = useState(null); //information about the pivot table
    //page meta
    const [editing, setEditing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false);
    const [downloading, setDownloading] = useState(false); //a file is downloading

    //get the pivot table details
    const getPT = async() => {
        try {
            const url = `/api/analysis/tables/${id}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if(response.ok){
                setTable(data)
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

    //load details once on init
    useEffect(() => {
        const initialLoad = async() => {
            await getPT();
            setLoading(false);
        }
        initialLoad();
    }, [id]);

    //handle a download to a csv
    const handleDownload = async () => {
        try {
            setDownloading(true);
            const response = await fetchWithAuth(`/api/analysis/tables/${id}/download/`);
            //file downloading jargon
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'report.csv';
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

    //delete the pivot table
    const handleDelete = async() => {
        try {
            const response = await fetchWithAuth(`/api/analysis/tables/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(id)
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
                setErrors(serverResponse);
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

    //get a list of all the row category values
    const rowBDs = table?.data[0].slice(0, table?.params.length - 1);
    //one breakdown will appear in the headers, so get those values
    const headerBD = table?.params.filter(p => (!rowBDs.includes(p)))[0];
    //first row is just the headers
    const headers = table?.data[0];
    //data starts at next row
    const rows = table?.data.slice(1);

    if(loading) return <ComponentLoading />
    return(
        <div>
            {del && <ConfirmDelete name={'this pivot table'} onCancel={() => setDel(false)} onConfirm={handleDelete} allowEasy={true} /> }
            {editing && <PivotTableSettings existing={table} onUpdate={(data) => {getPT(); onUpdate(data)}} onClose={() => setEditing(false)} meta={meta} />}
            <div className={styles.segment}>
                <h1>{table.display_name}</h1>
                <Messages errors={errors} />
                {table.name && <h3> For Indicator: {table.indicator.name}</h3>}
                <h3>Parameters</h3>
                {table.params.length > 0 && <p>Split by {table.params.map(p => (cleanLabels(p))).join(', ')}</p>}
                {table.start && <p>From {prettyDates(table.start)} {table.end && `to ${prettyDates(table.end)}`}</p>}
                {table.project && <p><strong>Project: </strong> {table.project.name}</p>}
                {table.organization && <p><strong>Organization: </strong> {table.organization.name} {table.cascade_organization && '(and subgrantees)'}</p>}
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <ButtonHover callback={() => setEditing(true)} noHover={<IoSettingsSharp />} hover='Edit Pivot Table' />
                    {downloading ? <ButtonLoading /> : 
                    <ButtonHover callback={() => handleDownload()} noHover={<PiFileCsvFill />} hover={'Download as CSV'} />}
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover='Delete Pivot Table' forDelete={true} />
                </div>
            </div>
            <div className={styles.table}>
                    <h2>Data</h2>
                <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                        {headers.sort((a, b) => {
                                if (headerBD === 'age_range') {
                                    return (AGE_ORDER[a] ?? -1) - (AGE_ORDER[b] ?? -1);
                                }
                                // fallback: lexicographic sort
                                return String(a).localeCompare(String(b));
                            }).map((header, i) => (
                                <th key={i}>{
                                    (!headers[0]) ? table.indicator.display_name : 
                                    breakdowns?.[headerBD]?.find(v => v.value == header)?.label ?? cleanLabels(header)}
                                </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                            <td key={colIndex}>{breakdowns?.[rowBDs[colIndex]]?.find(v => v.value == cell)?.label ?? 
                                (typeof(cell) === 'string' ? cleanLabels(cell) : cell)}</td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}