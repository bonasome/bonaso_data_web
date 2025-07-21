import { useEffect, useState, useCallback, useMemo } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndicatorsIndex from '../indicators/IndicatorsIndex';
import ModelSelect from '../reuseables/ModelSelect';
import SimpleSelect from '../reuseables/SimpleSelect';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import getColor from '../../../services/getColor';
import splitToChart from './splitToChart'
import Checkbox from '../reuseables/Checkbox';
import theme from '../../../theme/theme';
import styles from './dashboard.module.css';
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { IoIosArrowDropup } from "react-icons/io";
import { FaChartPie } from "react-icons/fa6";
import { FaChartBar } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa6";
import DataTable from './DataTable';
import MultiCheckbox from '../reuseables/MultiCheckbox';
import cleanLabels from '../../../services/cleanLabels';

export default function IndicatorChart({ chartData=null, dashboard, meta, onUpdate, onRemove, pos=0 }) {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [showDeets, setShowDeets] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [indicator, setIndicator] = useState(chartData?.chart?.indicator || null)
    const [chartType, setChartType] = useState(chartData?.chart?.chart_type || '')
    const [updating, setUpdating] = useState(false)
    const [legend, setLegend] = useState('');
    const [stack, setStack] = useState('');
    const [axis, setAxis] = useState('');
    const [useTarget, setUseTarget] = useState(false);
    const [tabular, setTabular] = useState(false);
    const [filters, setFilters] = useState({});
    const [fields, setFields] = useState(['age_range', 'sex', 'kp_type', 'disability_type', 'citizenship', 'hiv_status', 'pregnancy'])
    const [options, setOptions] = useState(null);
    const [subcategories, setSubcategories] = useState([]);

    useEffect(() => {
        if (chartData?.chart) {
            if (chartData.chart.indicator != null) {
                setIndicator(chartData.chart.indicator);
            }
            if (chartData.chart.chart_type != null) {
                setChartType(chartData.chart.chart_type);
            }
            if (chartData.chart.axis != null) {
                setAxis(chartData.chart.axis);
            }
            chartData.chart.legend ? setLegend(chartData.chart.legend) : setLegend('')
            chartData.chart.stack ? setStack(chartData.chart.stack) : setStack('')
            if (chartData.chart.use_target != null) {
                setUseTarget(chartData.chart.use_target);
            }
            if (chartData.chart.tabular != null) {
                setTabular(chartData.chart.tabular);
            }
            if(chartData.chart.filters){
                setFilters(chartData.chart.filters)
            }
        }
        if(!chartData) setShowDeets(true);
    }, [chartData])

    useEffect(() => {
        const getEventBreakdowns = async () => {
            try {
                console.log('fetching event details...');
                const response = await fetchWithAuth(`/api/analysis/dashboards/breakdowns/`);
                const data = await response.json();
                if(response.ok){
                    setOptions(data)
                }
            } 
            catch (err) {
                console.error('Failed to fetch event: ', err);
            } 
            finally{
                setLoading(false);
            }
        }
        getEventBreakdowns();
    }, [])

    useEffect(() => {
        const getIndicatorDetails = async () => {
            if(!indicator || indicator.subcategories === 0) return;
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/indicators/${indicator.id}/`);
                const data = await response.json();
                if(response.ok){
                    setSubcategories(data.subcategories)
                }
                else{
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                console.error('Failed to fetch indicator: ', err);
            } 
        };
        getIndicatorDetails();
    }, [indicator]);

    const handleUpdate = useCallback(async (ind, ct, ax, leg, stk, ut, tab, fil) => {
        setUpdating(true);
        let l = leg;
        let s = stk;
        let a = ax;
        let tar = ut ?? useTarget;
        // Clear legend/stack if target is used
        if (tar) {
            if (l) l = null;
            if (s) s = null;
        }
        // Normalize empty strings to null
        if (l === '') l = null;
        if (s === '') s = null;
        // For certain chart types, stack is irrelevant
        if (ct === 'Line' || ct === 'Pie') {
            s = null;
            setStack('');
        }
        if(ct==='Pie'){
            a = null;
            tar = false;
            setAxis('');
            setUseTarget(false);
        }
        const data = {
            chart_type: ct,
            axis: a,
            legend: l,
            stack: s,
            indicator: ind.id,
            chart_id: chartData?.id ?? null,
            use_target: ut,
            filters: fil,
            tabular: tab,
        };
        //console.log('Sending update:', data);
        await onUpdate(data, data.chart_id);
        setUpdating(false);
    }, [chartData, onUpdate, useTarget]);


    const handleRemove = () => {
        const id = chartData?.chart?.id || null
        onRemove(id)
    }


    const memoizedChart = useMemo(() => {
        if (!chartData?.chart?.chart_data || !options) return { dataArray: [], keys: [] };
        
        let targets = []
        if (useTarget && chartData.chart.targets){
            const targetKeys = Object.keys(chartData.chart.targets);
            const targetVals = Object.values(chartData.chart.targets);
            targets = targetKeys.map((key, index) => ({period: key, amount: targetVals[index]}))
        }
        return splitToChart(chartData.chart.chart_data, axis, legend, stack, targets, options);
    }, [chartData, useTarget, stack, legend]);

    const { dataArray, keys } = memoizedChart;


    const pieData = useMemo(() => {
        if(!dataArray ||dataArray.length ===0 || chartType !== 'Pie') return;
        return ['', 'subcategory'].includes(legend) ? Object.entries(dataArray[0]).filter(([key]) => key !== 'period').map(([key, value]) => ({ name: key, value })) :
            Object.entries(dataArray[0]).filter(([key]) => key !== 'period').map(([key, value]) => ({ name: options[legend][key], value }))
    }, [dataArray]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) {
            return (
                <div className="custom-tooltip" style={{ background: theme.colors.bonasoDarkAccent, padding: '8px', border: '1px solid #ccc', zIndex: 10, }}>
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
    console.log(filters)
    return(
        <div className={styles.chart}>
            {indicator && <h3>{indicator.name}</h3>}
            {chartData && chartType && <div>
                {chartType ==='Bar' && <ResponsiveContainer width="100%" height={300}>
                        <BarChart width={300} height={300} data={dataArray}>
                            <XAxis dataKey="period" tick={{fill: '#fff'}} />
                            <YAxis tick={{fill: '#fff'}}/>
                            <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                            <Legend />
                            {keys.map((group, index) => (
                                <Bar key={group.key} stackId={group.bar} dataKey={group.key} name={group.label} fill={getColor(index)}/>
                            ))}
                            {useTarget && <Bar dataKey="Target" fill="#82ca9d" name="Target" />}
                        </BarChart>
                    </ResponsiveContainer>}   
    
                {chartType === 'Line' && <ResponsiveContainer width="100%" height={300}>
                        <LineChart width={600} height={300} data={dataArray}>
                            <XAxis dataKey="period" tick={{fill: '#fff'}}/>
                            <YAxis tick={{fill: '#fff'}}/>
                            <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                            <Legend />
                            {keys.map(({ key, label }, index) => (
                                <Line key={key} dataKey={key} name={label} fill={getColor(index)} stroke={getColor(index)}/>
                            ))}
                        </LineChart>
                    </ResponsiveContainer>}
                {chartType === 'Pie' && legend=='' && <p><i>Select a legend item to view pie charts.</i></p> }
                {chartType === 'Pie' && pieData  && (<ResponsiveContainer width="100%" height={300}>
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
                {legend==='targets' && ['month', 'quarter'].includes(axis) && <p><i>
                    Please note that if a targets start/end date does not align with the given {axis} it may not 
                    reflect perfectly on the graph. Please consult the actual targets for more accurate information.
                </i></p>}
            </div>}
            {dataArray && options && tabular && <DataTable data={dataArray} breakdown1={legend} breakdown2={stack} map={options} />}
            <div className={styles.chartSettings}>
                <div className={styles.toggleDropdown} onClick={() => setShowDeets(!showDeets)}>
                    <h3 style={{ textAlign: 'start'}}>Show Chart Settings</h3>
                    {showDeets ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>
                {showDeets && <div className={styles.chartDeets}>
                    <ModelSelect IndexComponent={IndicatorsIndex} title={'Select an Indicator'} callback={(ind) => setIndicator(ind)} existing={indicator}/>
                    {indicator && <div>
                        <h3>Select a Chart</h3>
                        <div className={styles.chartSelector}>
                        <div className={chartType =='Bar' ? styles.selectedChart : styles.selectChart} onClick={() => {handleUpdate(indicator, 'Bar', axis, legend, stack, useTarget, tabular, filters); setChartType('Bar')}}>
                            <FaChartBar style={{ fontSize: '30px' }}/>
                        </div>
                        <div className={chartType =='Line' ? styles.selectedChart : styles.selectChart} onClick={() => {handleUpdate(indicator, 'Line', axis, legend, stack, useTarget, tabular, filters); setChartType('Line')}}>
                            <FaChartLine style={{ fontSize: '30px' }}/>
                        </div>
                        <div className={chartType =='Pie' ? styles.selectedChart : styles.selectChart} onClick={() => {handleUpdate(indicator, 'Pie', axis, legend, stack, useTarget, tabular, filters); setChartType('Pie')}}>
                            <FaChartPie style={{ fontSize: '30px' }}/>
                        </div>
                        </div>
                    </div>}
                    {indicator && chartType !== 'Pie' && <SimpleSelect label={'Select Axis'} name={'axis'} optionValues={meta.axes} optionLabels={meta.axis_labels} callback={(val) => handleUpdate(indicator, chartType, val, legend, stack, useTarget, tabular, filters)} value={axis}/>}
                    {indicator  && !useTarget && <SimpleSelect label={'Select Legend'} name={'legend'} optionValues={meta.fields} optionLabels={meta.field_labels} callback={(val) => handleUpdate(indicator, chartType, axis, val, stack, useTarget, tabular, filters)} value={legend}/>}
                    {indicator && legend && chartType=='Bar' && !useTarget && <SimpleSelect label={'Select Stack'} name={'stack'} optionValues={meta.fields} optionLabels={meta.field_labels} callback={(val) => handleUpdate(indicator, chartType, axis, legend, val, useTarget, tabular, filters)} value={stack}/>}
                    {indicator && chartType !== 'Pie' && chartData?.chart?.allow_targets && <Checkbox label={'Show Targets?'} name={'use_targets'} checked={useTarget} callback={(c) => handleUpdate(indicator, chartType, axis, legend, stack, c, tabular, filters)} />}
                    {indicator && <Checkbox label={'Show Data Table?'} name={'tabular'} checked={tabular} callback={(c) => handleUpdate(indicator, chartType, axis, legend, stack, useTarget, c, filters)} />}
                    <button onClick={() => handleRemove()}>Delete Chart</button>
                </div>}
            </div>
            <div className={styles.chartSettings}>
                <div className={styles.toggleDropdown} onClick={() => setShowFilters(!showFilters)}>
                    <h3 style={{ textAlign: 'start'}}>Show Filters</h3>
                    {showFilters ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>
                {indicator && showFilters && <div className={styles.chartFilters}>
                    {options && fields.map((o) => (
                        <MultiCheckbox label={cleanLabels(o)} optionValues={Object.keys(options[o]).map((c) => (c))} 
                            optionLabels={Object.keys(options[o]).map((c) => (options[o][c]))} 
                            callback={(vals) => {
                                const updatedFilters = { ...filters, [o]: vals };
                                setFilters(updatedFilters);
                                handleUpdate(indicator, chartType, axis, legend, stack, useTarget, tabular, updatedFilters);
                            }}
                            existing={filters[o]}
                        />
                    ))}
                    {subcategories.length > 0 && <MultiCheckbox label={'Subcategory'}
                        optionValues={subcategories.map((cat) => (cat.id))} optionLabels={subcategories.map((cat) => (cat.name))} 
                        callback={(vals) => {
                            const updatedFilters = { ...filters, subcategory: vals };
                            setFilters(updatedFilters);
                            handleUpdate(indicator, chartType, axis, legend, stack, useTarget, tabular, updatedFilters);
                        }}
                        existing={filters.subcategory} 
                    />}
                </div>}
            </div>
        </div>
    )
}

const download = async () => {
        const response = await fetchWithAuth(`/api/analysis/download-indicator-aggregate/${indicator.id}/?${paramsQuery}${splitQuery}/`,);

        if (!response.ok) {
            console.error('Failed to download CSV');
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        // Get filename from Content-Disposition
        const disposition = response.headers.get('Content-Disposition');
        const match = disposition && disposition.match(/filename="?([^"]+)"?/);
        const filename = match ? match[1] : 'aggregates.csv';

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }