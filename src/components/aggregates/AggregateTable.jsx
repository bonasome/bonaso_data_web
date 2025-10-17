import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/UserAuth';
import { Link } from 'react-router-dom';
import cleanLabels from '../../../services/cleanLabels';
import fetchWithAuth from '../../../services/fetchWithAuth';
import theme from '../../../theme/theme';
import { buildAutoMatrix } from './helpers';

import prettyDates from '../../../services/prettyDates';
import Messages from '../reuseables/Messages';
import FlagDetailModal from '../flags/FlagDetailModal';
import ComponentLoading from "../reuseables/loading/ComponentLoading";
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ConfirmDelete from '../reuseables/ConfirmDelete';

import styles from '../analytics/pivotTables/pt.module.css';

import { IoSettingsSharp } from "react-icons/io5";
import { FaTrashAlt } from 'react-icons/fa';
import { PiFileCsvFill } from "react-icons/pi";
import { ImPencil } from 'react-icons/im';

export default function AggregateTable({ id, meta, onDelete }){
    /*
    Displays a single pivot table with the option to download it as a csv.
    - id (integer): the id of the pivot table
    - breakdowns (object): the map of db values and labels to create readable labels
    - onUpdate (function): handle edits to settings
    - onDelete (function): handle deleting the table
    - meta (object): model information
    */
    const { user } = useAuth();
    const [count, setCount] = useState(null); //information about the pivot table
    const [viewingFlag, setViewingFlag] = useState(null);
    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false);

    const getCount = async() => {
        try {
            console.log('fetching aggregate details...');
            const url = `/api/aggregates/${id}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if(response.ok){
                setCount(data)
                console.log(data);
            }
            else{
                setErrors(['Something went wrong. Please try again later.'])
            }
        } 
        catch (err) {
            console.error('Failed to get meta:', err);
            setErrors(['Something went wrong. Please try again later.'])
        } 
        finally{
            setLoading(false);
        }
    }

    //get the pivot table details
    useEffect(() => {
        loadInitial = async() => {
            getCount();
        }
        loadInitial()
    }, [id]);

    //delete the pivot table
    const handleDelete = async() => {
        try {
            console.log('deleting pivot table...');
            const response = await fetchWithAuth(`/api/aggregates/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete();
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

    const matrix = useMemo(() => {
        if(!count?.counts) return {
            dims: null,
            uniques: [],
            rowTree: [],
            headerRows: [],
            colKeys: [],
            cells: []
        }
        return buildAutoMatrix(count.counts)
    }, [count]);
    const { rowTree, headerRows, colKeys, cells, dims } = matrix;


    // create thead rows for column dims (may be zero)
    const theadRows = headerRows?.length ? headerRows : [];

    const hasPerm = useMemo(() => {
        if(user.role == 'admin') return true;
        if(['meofficer', 'manager'].includes(user.role) && user.org_id == count?.organization.id) return true;
        return false
    }, [user]);

    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    if(loading) return <ComponentLoading />
    return (
        <div className="overflow-auto border rounded-md">
            {del && <ConfirmDelete name={'this aggregate count table'} onCancel={() => setDel(false)} onConfirm={handleDelete} /> }
            {viewingFlag && <FlagDetailModal flags={count.counts.find(c => (c.id == viewingFlag))?.flags} model={'aggregates.aggregatecount'} id={viewingFlag} onClose={() => {getCount(); setViewingFlag(null)}} /> }
            <table className="min-w-full border-collapse text-sm">
                <thead>
                    {/* Top-left corner: show row dims labels stacked vertically */}
                    <tr>
                    <th colSpan={dims.rowDims.length || 1} style={{ textAlign: 'left' }}>
                        {dims.rowDims.length ? dims.rowDims.map(d => cleanLabels(d)).join(' , ') : 'Rows'}
                    </th>
                        {theadRows.length === 0 ? (
                            // single header row when there are no column dims
                            <th >{dims.colDims.length ? dims.colDims.join(' , ') : 'Columns'}</th>
                        ) : (
                            // render top row cells that span the full header height (we'll render headerRows next)
                            <th colSpan={colKeys.length} style={{ textAlign: 'center' }}>Columns</th>
                        )}
                    </tr>


                    {/* If we have multi-level column headers, render them */}
                    {theadRows.length > 0 && theadRows.map((level, ri) => (
                        <tr key={`col-level-${ri}`}>
                            {/* left corner blank cells to align with row header depth */}
                                <th className="border p-1 bg-gray-50" colSpan={dims.rowDims.length || 1}></th>
                                {level.map((cell, ci) => (
                                    <th key={cell.key} className="border p-2 bg-white" colSpan={cell.span} style={{ textAlign: 'center' }}>
                                    {cleanLabels(cell.label)}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>


                <tbody>
                    {rowTree.map((r, ri) => (
                        <tr key={`row-${ri}`}>
                            {/* render each row's label parts into separate cells (nested row headers) */}
                            {r.labelParts.map((part, pi) => (
                                <td key={`r-${ri}-p-${pi}`} style={{ whiteSpace: 'nowrap' }}>
                                    {(dims.rowDims[pi] != 'option' ? getLabelFromValue(dims.rowDims[pi], part) : part) || ''}
                                </td>
                            ))}

                            {/* If row dims are fewer than a typical column, make sure table cell alignment remains */}
                            {r.labelParts.length === 0 && <td />}

                            {/* data cells for each column key */}
                            {colKeys.map((ck, ci) => {
                                if(cells[r.rowKey] && cells[r.rowKey][ck]?.id){
                                    const found = count.counts.find(c => c.id == cells[r.rowKey][ck]?.id);
                                    if(found.flags.length > 0){
                                        if(found.flags.filter(f => (!f.resolved)).length > 0){
                                            return(<td key={`cell-${ri}-${ci}`} style={{ backgroundColor: theme.colors.warningBg, cursor: 'pointer' }} onClick={() => setViewingFlag(cells[r.rowKey][ck]?.id)}>
                                                {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                            </td>)
                                        }
                                        else if(found.flags.filter(f => (!f.resolved)).length == 0){
                                            return(<td key={`cell-${ri}-${ci}`} style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, cursor: 'pointer' }} onClick={() => setViewingFlag(cells[r.rowKey][ck]?.id)}>
                                                {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                            </td>)
                                        }
                                    }
                                }
                                return(<td key={`cell-${ri}-${ci}`}>
                                    {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                </td>)
                            })}
                        </tr>
                    ))}


                    {/* If no rows exist, render a placeholder */}
                    {rowTree.length === 0 && (
                    <tr>
                        <td className="border p-2" colSpan={(dims.rowDims.length || 1) + (colKeys.length || 1)}>No data</td>
                    </tr>
                    )}
                </tbody>
            </table>

            {hasPerm && <div style={{ display: 'flex', flexDirection: 'row'}}> 
                <Link to={`/aggregates/${id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Counts'} /></Link>
                <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Count'} forDelete={true} />
            </div>}
        </div>
    )
}