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
    Displays information about an aggregate group with the counts represented as a pivot table. 
    - id (integer): the id of the aggregate group
    - meta (object): model information
    - onDelete (function): what to do if the component is deleted
    */
    const { user } = useAuth();

    const [count, setCount] = useState(null); //information about the pivot table
    const [viewingFlag, setViewingFlag] = useState(null); //is the user looking at a count's flags (and which one)
    //page meta
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false);

    //function to pull existing data
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

    //get the count details once on load
    useEffect(() => {
        const loadInitial = async() => {
            getCount();
        }
        loadInitial()
    }, [id]);

    //delete the count
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

    //see helpers for how the matrix is built
    const matrix = useMemo(() => {
        //if the count hasn't loaded yet, return an empty object
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

    //helper function to get a label from value (from the meta)
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
            <div style={{ backgroundColor: theme.colors.bonasoDarkAccent, padding: '4vh', margin: '2vh' }}>
                <h1>Aggregate Count for {count.display_name}</h1>
                <h3>By {count.organization.name} for {count.project.name}</h3>
                <h3><i>From {prettyDates(count.start)} to {prettyDates(count.end)}</i></h3>
                <UpdateRecord created_by={count.created_by} created_at={count.created_at} updated_by={count.updated_by} updated_at={count.updated_at} />
            </div>
            <Messages errors={errors} />
            <div style={{ backgroundColor: theme.colors.bonasoDarkAccent, padding: '4vh', margin: '2vh' }}>
            <h3>Aggregated Data</h3>
            {count.comments && count.comments != '' && <p><strong>Comments: </strong><i>{count.comments}</i></p>}
            {count?.counts?.length == 1 && <div>
                <h1>{count.counts[0]?.value}</h1>
                <i>Total Number</i>
            </div>}
            
            {/* If there is only one count in the group (one number), just display the number. */}
            {count?.counts?.length > 1 && (
                  <div className={styles.matrixWrap}>
                    <table className={styles.matrixTable}>
                      <thead className={styles.matrixThead}>
                        {/* Top-left corner */}
                        <tr>
                          <th
                            colSpan={dims.rowDims.length || 1}
                            className={`${styles.matrixTh} ${styles.matrixThLeft}`}
                          >
                            {dims.rowDims.length ? dims.rowDims.map(d => cleanLabels(d)).join(' , ') : 'Rows'}
                          </th>
                
                          {theadRows.length === 0 ? (
                            <th className={`${styles.matrixTh} ${styles.matrixThCenter}`}>
                              {dims.colDims.length ? dims.colDims.join(' , ') : 'Columns'}
                            </th>
                          ) : (
                            <th
                              colSpan={colKeys.length}
                              className={`${styles.matrixTh} ${styles.matrixThCenter}`}
                            >
                              Columns
                            </th>
                          )}
                        </tr>
                
                        {/* Multi-level column headers */}
                        {theadRows.length > 0 && theadRows.map((level, ri) => (
                          <tr key={`col-level-${ri}`}>
                            <th
                              colSpan={dims.rowDims.length || 1}
                              className={`${styles.matrixTh} ${styles.matrixThSpacer}`}
                            />
                            {level.map((cell) => (
                              <th
                                key={cell.key}
                                colSpan={cell.span}
                                className={`${styles.matrixTh} ${styles.matrixThCenter}`}
                              >
                                {dims.colDims[ri] != 'option'
                                  ? (getLabelFromValue(dims.colDims[ri], cell.label) ?? cell.label)
                                  : cell.label}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                
                      <tbody>
                        {rowTree.map((r, ri) => (
                          <tr key={`row-${ri}`} className={styles.matrixRow}>
                            {/* row header parts */}
                            {r.labelParts.map((part, pi) => (
                              <td
                                key={`r-${ri}-p-${pi}`}
                                className={`${styles.matrixTd} ${styles.matrixTdLabel}`}
                              >
                                {(dims.rowDims[pi] != 'option'
                                  ? getLabelFromValue(dims.rowDims[pi], part)
                                  : part) || ''}
                              </td>
                            ))}
                
                            {r.labelParts.length === 0 && (
                              <td className={`${styles.matrixTd} ${styles.matrixTdLabel}`} />
                            )}
                
                            {/* data cells */}
                            {colKeys.map((ck, ci) => {
                              const cell = cells?.[r.rowKey]?.[ck];
                              const cellId = cell?.id;
                
                              let flaggedClass = '';
                              let tooltipMsg = '';
                
                              if (cellId) {
                                const found = count.counts.find(c => c.id == cellId);
                                const flags = found?.flags || [];
                                if (flags.length > 0) {
                                  const unresolved = flags.some(f => !f.resolved);
                                  flaggedClass = unresolved ? styles.matrixFlagUnresolved : styles.matrixFlagResolved;
                                  tooltipMsg = unresolved
                                    ? 'This count has been flagged. Click the cell to find out more.'
                                    : 'This count was previously flagged. Click the cell to find out more.';
                                }
                              }
                
                              const clickable = Boolean(flaggedClass);
                
                              return (
                                <td
                                  key={`cell-${ri}-${ci}`}
                                  className={`${styles.matrixTd} ${flaggedClass} ${clickable ? styles.matrixClickable : ''}`}
                                  onClick={() => clickable && cellId && setViewingFlag(cellId)}
                                >
                                  <div className={styles.matrixPill}>
                                    {Number((cells[r.rowKey] && cells[r.rowKey][ck]?.value) || 0) || '-'}
                                  </div>
                                  {clickable && <Tooltip msg={tooltipMsg} />}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                
                        {rowTree.length === 0 && (
                          <tr>
                            <td
                              className={styles.matrixEmpty}
                              colSpan={(dims.rowDims.length || 1) + (colKeys.length || 1)}
                            >
                              No data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

            {!['client'].includes(user.role) && <div style={{ display: 'flex', flexDirection: 'row'}}> 
                <Link to={`/aggregates/${id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Counts'} /></Link>
                <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Count'} forDelete={true} />
            </div>}
            </div>
        </div>
    )
}
