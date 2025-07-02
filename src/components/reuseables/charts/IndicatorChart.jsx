import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import monthlyCounts from './monthlyCounts'
import { useRespondents } from '../../../contexts/RespondentsContext';
import SimpleSelect from '../SimpleSelect';
import Checkbox from '../Checkbox';
import styles from './chart.module.css';
import theme from '../../../../theme/theme';

export default function IndicatorChart({ indicatorID, organizationID=null, projectID=null }) {
    const { respondentsMeta, setRespondentsMeta } = useRespondents();
    const [data, setData] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [chartType, setChartType] = useState('')
    const [axis, setAxis] = useState('');
    const [axisOptions, setAxisOptions] = useState(['month', 'quarter']);
    const [axisLabels, setAxisLabels] = useState(['By Month', 'By Quarter']);
    const [allowNullAxis, setAllowNullAxis] = useState(true);
    const [legendOptions, setLegendOptions] = useState([]);
    const [legendLabels, setLegendLabels] = useState([]);
    const [subcategories, setSubcategories] = useState([])
    const [legend, setLegend] = useState('');
    const [orgIDs, setOrgIDs] = useState([]);
    const [orgNames, setOrgNames] = useState([]);
    const[search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        sex: '',
        age_range: '',
        district: '',
        citizen: '',
        kp_status: [],
        disability_status: [],
        organization: '',
        after: '',
        before: '',
    });
    const [chartData, setChartData] = useState(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getInteractions = async() => {
            setLoading(true)
            try {
                console.log('fetching respondent details...');
                const urlFilters = (organizationID ? `&organization=${organizationID}` : '') +
                    (projectID ? `&project=${projectID}` : '');
                const response = await fetchWithAuth(`/api/indicators/chart-data/?indicator=${indicatorID}${urlFilters}`);
                const data = await response.json();
                setData(data[0]);
                setLegendOptions(data[0].legend)
                setLegendLabels(data[0].legend_labels)
                setChartData(monthlyCounts(data[0]));
                setLoading(false)
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false)
            }
        }
        getInteractions();
    }, [indicatorID, projectID, organizationID])

    useEffect(() => {
        const getRespondentMeta = async () => {
            setLoading(true)
            if(Object.keys(respondentsMeta).length !== 0){
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching respondents meta...');
                    const response = await fetchWithAuth(`/api/record/respondents/meta/`);
                    const data = await response.json();
                    setRespondentsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch respondent model information: ', err)
                    setLoading(false)
                }
            }
        }
        getRespondentMeta();

        if(!organizationID){
            const getOrganizations = async () => {
                try{
                    console.log('fetching organizations...')
                    const projectFilter = projectID ? `&project=${projectID}` : '';
                    const response = await fetchWithAuth(`/api/organizations/?search=${search}${projectFilter}`);
                    const data = await response.json();
                    if(data.results.length > 0){
                        const ids = data.results.map((o) => o.id);
                        const names= data.results.map((o)=> o.name);
                        setOrgIDs(ids);
                        setOrgNames(names);
                    }
                    setLoading(false)
                }
                catch(err){
                    console.error('Failed to fetch organizations: ', err)
                    setLoading(false)
                }
            }
            getOrganizations();
        }
    }, [search])

    useEffect(() => {
        if(data){
            setChartData(monthlyCounts(data, filters, axis, legend, respondentsMeta));
        }
    }, [data, filters, axis, legend])

    useEffect(() => {
        if(!chartData || chartData.length === 0) return;
        let groups = [];
        chartData.forEach((g) => {
            const keys = Object.keys(g)
            keys.forEach(key => {
                if(key === 'ag' || key === 'target' || key === 'count') return;
                if(groups.includes(key)) return;
                groups.push(key);
            })
        })
        setSubcategories(groups);
    }, [chartData])

    useEffect(() => {
        if(chartType === 'bar'){
            setAllowNullAxis(true);
            setAxisOptions(['month', 'quarter']);
            setAxisLabels(['By Month', ' By quarter']);
        }
        if(chartType === 'line'){
            setAllowNullAxis(false);
            setAxisOptions(['month', 'quarter']);
            setAxisLabels(['By Month', ' By quarter']);
            if(axis === '') setAxis('month');
        }
        if(chartType === 'pie'){
            setAllowNullAxis(true)
            setAxisOptions([])
            setAxisLabels([])
            setAxis('')
        }
    }, [chartType]);


    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;

        return (
            <div style={{ backgroundColor: 'rgb(2, 23, 10)',  padding: '6px' }}>
                <p style={{textDecoration: 'underline'}}><strong>{label}</strong></p>
                {payload.map((entry, index) => (
                    <div key={index}>
                        <p style={{ color: entry.color }}><i>{entry.name}:</i></p>
                        <strong><p style={{ color: entry.color }}>{entry.value}</p></strong>
                    </div>
                ))}
            </div>
        );
    };

    const getRandomColor = () =>{
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
    const getColor = (index) => {
        console.log(index)
        switch (index){
            case 0:
                return '#fff'
            case 1:
                return theme.colors.bonasoLightAccent
            case 2:
                return theme.colors.bonasoAlternateLight
            case 3:
                return theme.colors.bonasoAlternateUberLight
            case 4:
                return theme.colors.warningBg
            case 5:
                return theme.colors.bonasoUberLightAccent
            case 6:
                return theme.colors.lightGrey
            default:
                return getRandomColor()
        }
    }


    if (loading || !chartData) return <p>Loading...</p>;
    return(
        <div>
            {(chartType === '' || chartType ==='bar') && 
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart width={600} height={300} data={chartData}>
                        <XAxis dataKey="ag" tick={{fill: '#fff'}}/>
                        <YAxis tick={{fill: '#fff'}}/>
                        <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                        <Legend />
                        {['', 'targets'].includes(legend) && <Bar dataKey="count" fill="#fff" name="Acheivement" />}
                        {subcategories.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={getColor(index)}/>
                        ))}
                        {legend === 'targets' && <Bar dataKey="target" fill="#ec7070" name="Target" />}
                    </BarChart>
                </ResponsiveContainer>
            }   

            {chartType === 'line' && 
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart width={600} height={300} data={chartData}>
                        <XAxis dataKey="ag" tick={{fill: '#fff'}}/>
                        <YAxis tick={{fill: '#fff'}}/>
                        <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                        <Legend />
                        {['', 'targets'].includes(legend) && <Line dataKey="count" fill="#fff" stroke='#fff' name="Acheivement" />}
                        {subcategories.map((key, index) => (
                            <Line key={key} dataKey={key} fill={getColor(index)} stroke={getColor(index)}/>
                        ))}
                        {legend === 'targets' && <Line dataKey="target" fill="#ec7070" stroke="#ec7070" name="Target" />}
                    </LineChart>
                </ResponsiveContainer>
            }
            {chartType === 'pie' && legend=='' && <p><i>Select a legend item to view pie charts.</i></p> }
            {chartType === 'pie' && legend=='targets' && <p><i>Targets don't really work with a pie chart... try another view!</i></p> }
            {chartType === 'pie' && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart width={400} height={300}>
                        <Pie
                        data={subcategories.map((key) => ({
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
                </ResponsiveContainer>
            )}



            <SimpleSelect name='legend' optionValues={legendOptions} optionLabels={legendLabels} callback={(val) => setLegend(val)} value={legend} />
            <SimpleSelect name='axis' optionValues={axisOptions} optionLabels={axisLabels} callback={(val) => setAxis(val)} value={axis} nullOption={allowNullAxis} />
            <SimpleSelect name='chart' optionValues={['bar', 'line', 'pie']} optionLabels={['Bar', 'Line', 'Pie']} callback={(val) => setChartType(val)} value={chartType} nullOption={false}/>
            
            <Checkbox label='Show Filters?' name="filters" checked={showFilters} callback={(c) => setShowFilters(c)} />
            {showFilters && <div>
                <h3>Filters</h3>
                <div className={styles.filters}>
                <SimpleSelect name='sex' optionValues={respondentsMeta.sexs} optionLabels={respondentsMeta.sex_labels} callback={(val) => setFilters(prev => ({...prev, sex: val}))} />
                <SimpleSelect name='age_range' label={'Age Range'} optionValues={respondentsMeta.age_ranges} optionLabels={respondentsMeta.age_range_labels} callback={(val) => setFilters(prev => ({...prev, age_range: val}))} />
                <SimpleSelect name='district' optionValues={respondentsMeta.districts} optionLabels={respondentsMeta.district_labels} callback={(val) => setFilters(prev => ({...prev, district: val}))} />
                <SimpleSelect name='citizen' optionValues={[true, false]} optionLabels={['Citizen', 'Non-Citizen']} callback={(val) => setFilters(prev => ({...prev, citizen: val}))} value={filters.citizen}/>
                <SimpleSelect name='kp_status' label='Key Population Status' 
                    optionValues={respondentsMeta.kp_types} 
                    multiple={true} optionLabels={respondentsMeta.kp_type_labels}
                    callback={(val) => setFilters(prev => ({ ...prev, kp_status: val }))} 
                />
                <SimpleSelect name='disability_status' label='Disability Status' 
                    optionValues={respondentsMeta.disability_types} 
                    multiple={true} optionLabels={respondentsMeta.disability_type_labels}
                    callback={(val) => setFilters(prev => ({ ...prev, disability_status: val }))}
                />
                <SimpleSelect name='organization' label='Organization' 
                    optionValues={orgIDs} search={true} searchCallback={(val) => setSearch(val)}
                    multiple={false} optionLabels={orgNames}
                    callback={(val) => setFilters(prev => ({ ...prev, organization: val }))}
                />
                <div>
                    <div>
                        <label htmlFor='after' >After</label>
                        <input id='after' type='date' value={filters.after} onChange={(e) => setFilters(prev => ({...prev, after: e.target.value}))} />
                    </div>
                    <div>
                        <label htmlFor='before' >Before</label>
                        <input id='before' type='date' value={filters.before} onChange={(e) => setFilters(prev => ({...prev, before: e.target.value}))} />
                    </div>
                    </div>
                </div>
            </div>}
        </div>
    )
}
