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
import Tooltip from '../reuseables/Tooltip';
import UpdateRecord from '../reuseables/meta/UpdateRecord';

import styles from '../analytics/pivotTables/pt.module.css';

import { FaTrashAlt } from 'react-icons/fa';
import { ImPencil } from 'react-icons/im';
import { MdFlag } from "react-icons/md";

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
            const url = `/api/aggregates/${id}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if(response.ok){
                setCount(data)
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
        const loadInitial = async() => {
            getCount();
        }
        loadInitial()
    }, [id]);

    //delete the pivot table
    const handleDelete = async() => {
        try {
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
        return buildAutoMatrix(count.counts, count.indicator)
    }, [count]);
    const { rowTree, headerRows, colKeys, cells, dims } = matrix;


    // create thead rows for column dims (may be zero)
    const theadRows = headerRows?.length ? headerRows : [];

    const getLabelFromValue = (field, value) => {
        if(!meta) return null;
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    if(loading) return <ComponentLoading />
    return (
        <div>
            {del && <ConfirmDelete name={'this aggregate count table'} onCancel={() => setDel(false)} onConfirm={handleDelete} /> }
            {viewingFlag && <FlagDetailModal flags={count.counts.find(c => (c.id == viewingFlag))?.flags} model={'aggregates.aggregatecount'} id={viewingFlag} onClose={() => {getCount(); setViewingFlag(null)}} /> }
            <div style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: '4vh', margin: '2vh' }}>
                <h1>Aggregate Count for {count.display_name}</h1>
                <h3>By {count.organization.name} for {count.project.name}</h3>
                <h3><i>From {prettyDates(count.start)} to {prettyDates(count.end)}</i></h3>
                <UpdateRecord created_by={count.created_by} created_at={count.created_at} updated_by={count.updated_by} updated_at={count.updated_at} />
            </div>
            <Messages errors={errors} />
            <div style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: '4vh', margin: '2vh' }}>
            <h3>Aggregated Data</h3>
            {count.comments && count.comments != '' && <p><strong>Comments: </strong><i>{count.comments}</i></p>}
            {count?.counts?.length == 1 && <div>
                <h1>{count.counts[0]?.value}</h1>
                <i>Total Number</i>
            </div>}

            {count?.counts?.length > 1 && <table style={{  marginLeft: 'auto', marginRight: 'auto' }}>
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
                                    {dims.colDims[ri] != 'option' ?  getLabelFromValue(dims.colDims[ri], cell.label) : cell.label}
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
                                <td key={`r-${ri}-p-${pi}`} style={{ padding: '1vh', textAlign: 'center' }}>
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
                                            return(<td key={`cell-${ri}-${ci}`} style={{ backgroundColor: theme.colors.warning, cursor: 'pointer', textAlign: 'center' }} onClick={() => setViewingFlag(cells[r.rowKey][ck]?.id)}>
                                                {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                                <Tooltip msg={'This count has been flagged. Click the cell to find out more.'} />
                                            </td>)
                                        }
                                        else if(found.flags.filter(f => (!f.resolved)).length == 0){
                                            return(<td key={`cell-${ri}-${ci}`} style={{ textAlign: 'center', backgroundColor: theme.colors.bonasoLightAccent , cursor: 'pointer' }} onClick={() => setViewingFlag(cells[r.rowKey][ck]?.id)}>
                                                {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                                <Tooltip msg={'This count was previously flagged. Click the cell to find out more.'} />
                                            </td>)
                                        }
                                    }
                                }
                                return(<td key={`cell-${ri}-${ci}`} style={{ textAlign: 'center' }}>
                                    {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                </td>)
                            })}
                        </tr>
                    ))}


                    {/* If no rows exist, render a placeholder */}
                    {rowTree.length === 0 && (
                    <tr>
                        <td colSpan={(dims.rowDims.length || 1) + (colKeys.length || 1)}>No data</td>
                    </tr>
                    )}
                </tbody>
            </table>}
            {!['client'].includes(user.role) && <div style={{ display: 'flex', flexDirection: 'row'}}> 
                <Link to={`/aggregates/${id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Counts'} /></Link>
                <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Count'} forDelete={true} />
            </div>}
            </div>
        </div>
    )
}