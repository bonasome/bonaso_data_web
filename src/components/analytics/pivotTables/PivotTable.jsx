import { useState, useEffect } from 'react';

import cleanLabels from '../../../../services/cleanLabels';
import fetchWithAuth from '../../../../services/fetchWithAuth';

import Messages from '../../reuseables/Messages';
import ComponentLoading from "../../reuseables/loading/ComponentLoading";
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import PivotTableSettings from './PivotTableSettings';
import ConfirmDelete from '../../reuseables/ConfirmDelete';

import { IoSettingsSharp } from "react-icons/io5";
import { FaTrashAlt } from 'react-icons/fa';
import { PiFileCsvFill } from "react-icons/pi";
import ButtonLoading from '../../reuseables/loading/ButtonLoading';

export default function PivotTable({ id, breakdowns, onUpdate, onDelete, meta }){
    const [table, setTable] = useState(null);
    //meta
    const [editing, setEditing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const getPT = async() => {
        try {
            console.log('fetching pivot table...');
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

    useEffect(() => {
        const initialLoad = async() => {
            await getPT();
            setLoading(false);
        }
        initialLoad();
    }, []);


    const handleDownload = async () => {
        try {
            setDownloading(true);
            const response = await fetchWithAuth(`/api/analysis/tables/${id}/download/`);
            
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

    const handleDelete = async() => {
        try {
            console.log('deleting pivot table...');
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

    const rowBDs = table?.data[0].slice(0, table?.params.length - 1);
    const headerBD = table?.params.filter(p => (!rowBDs.includes(p)))[0];
    const headers = table?.data[0];
    const rows = table?.data.slice(1);

    if(loading) return <ComponentLoading />
    return(
        <div>
            {del && <ConfirmDelete name={'this pivot table'} onCancel={() => setDel(false)} onConfirm={handleDelete} allowEasy={true} /> }
            {editing && <PivotTableSettings existing={table} onUpdate={(data) => {getPT(); onUpdate(data)}} onClose={() => setEditing(false)} meta={meta} />}
            <h1>{table.display_name}</h1>
            <Messages errors={errors} />
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <ButtonHover callback={() => setEditing(true)} noHover={<IoSettingsSharp />} hover='Edit Pivot Table' />
                {downloading ? <ButtonLoading /> : 
                <ButtonHover callback={() => handleDownload()} noHover={<PiFileCsvFill />} hover={'Download as CSV'} />}
                <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover='Delete Pivot Table' forDelete={true} />
            </div>
            <div>
                <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                        {headers.map((header, i) => (
                            <th key={i}>{(!headers[0]) ? table.indicator.display_name : 
                                breakdowns?.[headerBD]?.[header] ?? cleanLabels(header)}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                            <td key={colIndex}>{breakdowns?.[rowBDs[colIndex]]?.[cell] ?? 
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