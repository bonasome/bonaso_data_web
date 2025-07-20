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

export default function IndicatorChart({ chartData=null, dashboard, meta, onUpdate, onRemove, pos=0 }) {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [indicator, setIndicator] = useState(chartData?.chart?.indicator || null)
    const [chartType, setChartType] = useState(chartData?.chart?.chart_type || '')
    const [updating, setUpdating] = useState(false)
    const [legend, setLegend] = useState('');
    const [stack, setStack] = useState('');
    const [axis, setAxis] = useState('');
    const [useTarget, setUseTarget] = useState(false);
    const [filters, setFilters] = useState({});
    const [fields, setFields] = useState(['age_range', 'sex', 'kp_type', 'disability_type', 'citizenship', 'hiv_status', 'pregnancy'])
    const [options, setOptions] = useState({});
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
            if(chartData.chart.filters){
                setFilters(chartData.chart.filters)
            }
        }
    }, [chartData])

    useEffect(() => {
        const getEventBreakdowns = async () => {
            try {
                console.log('fetching event details...');
                const response = await fetchWithAuth(`/api/activities/events/breakdowns-meta/`);
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

    const handleUpdate = useCallback(async (ind, ct, ax, leg, stk, ut, fil) => {
        setUpdating(true);
        let l = leg
        let s = stk
        const tar = ut || useTarget
        if (l && tar) l = null;
        if (s && tar) s = null;
        if(l==='') l=null;
        if(s==='') s=null;
        console.log(s)
        const data = {
            chart_type: ct,
            axis: ax,
            legend: l,
            stack: s,
            indicator: ind.id,
            chart_id: chartData?.id ?? null,
            use_target: ut,
            filters: fil
        };
        console.log(data)
        await onUpdate(data, data.chart_id);
        setUpdating(false);
    }, [chartType, axis, legend, stack, useTarget, filters, chartData, onUpdate]);

    const handleRemove = () => {
        const id = chartData?.chart?.id || null
        onRemove(id)
    }


    const memoizedChart = useMemo(() => {
        if (!chartData?.chart?.chart_data) return { dataArray: [], keys: [] };

        let targets = []
        if (useTarget && chartData.chart.targets){
            const targetKeys = Object.keys(chartData.chart.targets);
            const targetVals = Object.values(chartData.chart.targets);
            targets = targetKeys.map((key, index) => ({period: key, amount: targetVals[index]}))
        }
        return splitToChart(chartData.chart.chart_data, legend, stack, targets);
    }, [chartData, useTarget, stack, legend]);

    const { dataArray, keys } = memoizedChart;

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

    console.log(chartData)
    return(
        <div>
            <ModelSelect IndexComponent={IndicatorsIndex} title={'Select an Indicator'} callback={(ind) => setIndicator(ind)} existing={indicator}/>
            {indicator && <SimpleSelect label={'Select Chart Type'} name={'chart_type'} optionValues={meta.chart_types} optionLabels={meta.chart_type_labels} callback={(val) => handleUpdate(indicator, val, axis, legend, stack, useTarget, filters)} value={chartType}/>}
            {indicator && <SimpleSelect label={'Select Axis'} name={'axis'} optionValues={meta.axes} optionLabels={meta.axis_labels} callback={(val) => handleUpdate(indicator, chartType, val, legend, stack, useTarget, filters)} value={axis}/>}
            {indicator && !useTarget && <SimpleSelect label={'Select Legend'} name={'legend'} optionValues={meta.fields} optionLabels={meta.field_labels} callback={(val) => handleUpdate(indicator, chartType, axis, val, stack, useTarget, filters)} value={legend}/>}
            {indicator && legend && !useTarget && <SimpleSelect label={'Select Stack'} name={'stack'} optionValues={meta.fields} optionLabels={meta.field_labels} callback={(val) => handleUpdate(indicator, chartType, axis, legend, val, useTarget, filters)} value={stack}/>}
            {indicator && chartData.chart.allow_targets && <Checkbox label={'Show Targets?'} name={'use_targets'} checked={useTarget} callback={(c) => handleUpdate(indicator, chartType, axis, legend, stack, c, filters)} />}
            {chartData && chartType && <div>
                {chartType ==='Bar' && <ResponsiveContainer width="100%" height={300}>
                        <BarChart width={600} height={300} data={dataArray}>
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
                            {keys.map(({ key, stackId, label }, index) => (
                                <Line key={key} stackId={stackId} dataKey={key} fill={getColor(index)} stroke={getColor(index)}/>
                            ))}
                        </LineChart>
                    </ResponsiveContainer>}
                {chartType === 'Pie' && legend=='' && <p><i>Select a legend item to view pie charts.</i></p> }
                {chartType === 'Pie' && legend=='targets' && <p><i>Targets don't really work with a pie chart... try another view!</i></p> }
                {chartType === 'Pie' && chartData.length > 0 && (<ResponsiveContainer width="100%" height={300}>
                        <PieChart width={400} height={300}>
                            <Pie
                            data={keys.map((key) => ({
                                name: key,
                                value: chartData[0][key] || 0,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                            >
                            {subcategories.map((key, index) => (
                                <Cell key={key} fill={getColor(index)} />
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
            {indicator && <div>
                {options && fields.map((o) => (
                    <SimpleSelect name={o} optionValues={options[o]} 
                        optionLabels={options[`${o}_labels`]} 
                        callback={(val) => {
                            const updatedFilters = { ...filters, [o]: val };
                            setFilters(updatedFilters);
                            handleUpdate(indicator, chartType, axis, legend, stack, useTarget, updatedFilters);
                        }}
                        multiple={true} value={filters[o]}
                    />
                ))}
                {subcategories.length > 0 && <SimpleSelect name={'subcategory'} 
                    optionValues={subcategories.map((cat) => (cat.id))} optionLabels={subcategories.map((cat) => (cat.name))} 
                    callback={(val) => {
                        const updatedFilters = { ...filters, subcategory: val };
                        setFilters(updatedFilters);
                        handleUpdate(indicator, chartType, axis, legend, stack, useTarget, updatedFilters);
                    }}
                    multiple={true} value={filters.subcategory} 
                />}
            </div>}
            <button onClick={() => handleRemove()}>Delete Chart</button>
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