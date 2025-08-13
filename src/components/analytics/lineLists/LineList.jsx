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
    const [list, setList] = useState(null);
    //meta
    const [editing, setEditing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const getLL = async() => {
        try {
            console.log('fetching line list...');
            const url = `/api/analysis/lists/${id}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if(response.ok){
                setList(data)
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

    useEffect(() => {
        const initialLoad = async() => {
            await getLL();
            setLoading(false);
        }
        initialLoad();
    }, []);


    const handleDownload = async () => {
        try {
            setDownloading(true);
            const response = await fetchWithAuth(`/api/analysis/lists/${id}/download/`);
            
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

    const handleDelete = async() => {
        try {
            console.log('deleting line list...');
            const response = await fetchWithAuth(`/api/analysis/lists/${id}/`, {
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

    console.log(list)
    const headers = list?.data.length > 0 ? Object.keys(list?.data[0]) : [];
    const rows = list?.data;

    const cleanCell = (cell, col) => {
        if(['indicator', 'organization', 'project', 'numeric_component', 'subcategory'].includes(headers[col])) return cell;
        if(['dob', 'interaction_date'].includes(headers[col])) return prettyDates(cell);
        if(headers[col] === 'citizenship'){
            const country = countries.find(c => c.cca2 === cell.toUpperCase());
            return country ? country.name.common : null;
        }
        if(cell === true) return 'True';
        if(cell === false) return 'False';
        if(Array.isArray(cell)){
            let cat = headers[col]
            if(cat == 'kp_status') cat = 'kp_type';
            if(cat == 'disability_status') cat='disability_type';
            return cell.map(c => (breakdowns?.[cat]?.[c] ?? 
                (typeof(c) === 'string' ? cleanLabels(c) : c))).join(', ')
        }
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