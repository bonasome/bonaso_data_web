import { useEffect, useState, useCallback, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';

import cleanLabels from '../../../../services/cleanLabels';
import getColor from '../../../../services/getColor';
import splitToChart from './splitToChart';
import theme from '../../../../theme/theme';
import fetchWithAuth from '../../../../services/fetchWithAuth';

import ConfirmDelete from '../../reuseables/ConfirmDelete';
import Messages from '../../reuseables/Messages';
import ChartFilters from './ChartFilters';
import DataTable from './DataTable';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import ChartSettingsModal from './ChartSettingsModal';

import styles from './dashboard.module.css';

import { FaTrashAlt } from 'react-icons/fa';
import { IoIosArrowDropdownCircle, IoIosArrowDropup } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";

export default function IndicatorChart({ chartData, dashboard, meta, options, onUpdate, onRemove }) {
    /*
    Component that displays an individual chart within a dashboard.
    - chartData (object): the data about the specific chart (found in the dashboard object)
    - dashboard (object): contains information about the dashboard this chart is a part of
    - meta (object): the dashboard meta
    - options (object): The breakdown options used for construcitng legends/filters
    - onUpdate (function): What to do when the chart is updated so that the data is current
    - onRemove (function): What to do when the chart is deleted
    */

    const [showFilters, setShowFilters] = useState(false); //toggle filter dropdown
    const [editing, setEditing] = useState(false); //toggle settings modal
    //meta
    const [errors, setErrors] = useState([]);
    const [del, setDel] = useState(false);

    //handle deleting the chart
    const handleRemove = async(id) => {
        try{
            const response = await fetchWithAuth(`/api/analysis/dashboards/${dashboard.id}/remove-chart/${chartData.id}/`, {
                method: 'DELETE',
            });
            const returnData = await response.json();
            if(response.ok){
                onRemove(returnData.id);
                setDel(false);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record project: ', err)
        }
        finally{
            setDel(false);
        }
    }

    //prepare the data for rechart
    const memoizedChart = useMemo(() => {
        if (!chartData || chartData.chart?.chart_data.length === 0 || !options) return { dataArray: [], keys: [] };
        
        //if using targets, prepare the targets sent with chartData for use in rechart
        let targets = []
        if (chartData.chart.use_targets && chartData.chart.targets){
            const targetKeys = Object.keys(chartData.chart.targets);
            const targetVals = Object.values(chartData.chart.targets);
            targets = targetKeys.map((key, index) => ({period: key, amount: targetVals[index]}))
        }
        const legend = chartData.chart.indicators.length > 1 ? 'indicator' : chartData.chart.legend //if there is more than one indicator, set the legend to indicator for ease of reference
        return splitToChart(chartData.chart.chart_data, options, chartData.chart.axis, legend, chartData.chart.stack, chartData.chart?.targets ?? []);
    }, [chartData]);
    
    const { dataArray, keys } = memoizedChart; //things used to construct the chart

    //additional cleaning for pies
    const pieData = useMemo(() => {
        if(!dataArray ||dataArray.length ===0 || chartData.chart.chart_type !== 'pie') return;
        return ['', 'subcategory'].includes(chartData.chart.legend) ? Object.entries(dataArray[0]).filter(([key]) => key !== 'period').map(([key, value]) => ({ name: key, value })) :
            Object.entries(dataArray[0]).filter(([key]) => key !== 'period').map(([key, value]) => ({ name: options[chartData.chart.legend]?.[key] ?? cleanLabels(key), value }))
    }, [dataArray]);

    //custom toolip to show stacl/legend
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) {
            return (
                <div className="custom-tooltip" style={{ backgroundColor: theme.colors.bonasoDarkAccent, padding: '8px', border: '1px solid #ccc', zIndex: 1000, }}>
                    <strong>{label}</strong>
                    <ul>
                    {payload.map((entry) => {
                        return (
                        <li key={entry.dataKey} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </li>
                        );
                    })}
                    </ul>
                </div>
            );
        }
        return null;
    };

    return(
        <div className={styles.chart}>
            {chartData &&  <div>
                {del && <ConfirmDelete onCancel={() => setDel(false)} onConfirm={handleRemove} allowEasy={true} name={'this beautiful chart'} />}
                
                <h2>{chartData.chart.display_name}</h2>
                
                <Messages errors={errors} />
                {dataArray.length === 0 && <p><i>No data yet.</i></p>}
                {dataArray.length > 0 && chartData.chart.chart_type ==='bar' && <ResponsiveContainer width="100%" height={300}>
                    <BarChart width={300} height={300} data={dataArray}>
                        <XAxis dataKey="period" tick={{fill: '#fff'}} />
                        <YAxis tick={{fill: '#fff'}}/>
                        <Tooltip cursor={{ fill: 'none' }} wrapperStyle={{ zIndex: 300 }} content={<CustomTooltip />} />
                        {keys.length < 12 && <Legend />}
                        {keys.map((group, index) => (
                            <Bar key={group.key} stackId={group.bar} dataKey={group.key} name={group.label} fill={getColor(index)}/>
                        ))}
                        {chartData.chart.use_target && <Bar dataKey="Target" fill="#82ca9d" name="Target" />}
                    </BarChart>
                </ResponsiveContainer>}   
    
                {dataArray.length > 0 && chartData.chart.chart_type === 'line' && <ResponsiveContainer width="100%" height={300}>
                    <LineChart width={600} height={300} data={dataArray}>
                        <XAxis dataKey="period" tick={{fill: '#fff'}}/>
                        <YAxis tick={{fill: '#fff'}}/>
                        <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                        <Legend />
                        {keys.map(({ key, label }, index) => (
                            <Line key={key} dataKey={key} name={label} fill={getColor(index)} stroke={getColor(index)}/>
                        ))}
                        {chartData.chart.use_target && <Line dataKey="Target" fill="#82ca9d" name="Target" />}
                    </LineChart>
                </ResponsiveContainer>}
                
                {chartData.chart.chart_type === 'pie' && !chartData.chart.legend &&  <p><i>Select a legend item to view pie charts.</i></p> }
                {dataArray.length > 0 && chartData.chart.chart_type === 'pie' && pieData  && (<ResponsiveContainer width="100%" height={300}>
                    <PieChart width={400} height={300}>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(index)} stroke={getColor(index)} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>)}
            </div>}

            {dataArray.length > 0 && chartData.chart.tabular && <DataTable data={dataArray} 
                breakdown1={chartData.chart.use_target ? 'Target' : (chartData.chart.indicators.length > 1 ? 
                    'indicator' : chartData.chart.legend)} 
                breakdown2={chartData.chart.stack} map={options}
            />}

            <div style={{ display: 'flex', flexDirection: 'row'}}>
                <ButtonHover callback={() => setEditing(true)} noHover={<IoSettingsSharp />} hover={'Edit Chart Settings'} />
                <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Chart'} forDelete={true}/>
            </div>


            {editing && <ChartSettingsModal chart={chartData?.chart ?? null} dashboard={dashboard} 
                meta={meta} onUpdate={onUpdate} onClose={() => setEditing(false)} />}

            <div className={styles.chartSettings}>

                <div className={styles.toggleDropdown} onClick={() => setShowFilters(!showFilters)}>
                    <h3 style={{ textAlign: 'start'}}>Show Filters</h3>
                    {showFilters ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>

                {showFilters && <div className={styles.chartFilters}>
                    <ChartFilters chart={chartData} options={options} dashboard={dashboard} onUpdate={onUpdate}/>
                </div>}

            </div>
        </div>
    )
}