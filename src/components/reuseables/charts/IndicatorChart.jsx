import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import monthlyCounts from './monthlyCounts'
import { useRespondents } from '../../../contexts/RespondentsContext';
import SimpleSelect from '../SimpleSelect';
import Checkbox from '../Checkbox';
import styles from './chart.module.css';

export default function IndicatorChart({ indicatorID, organizationID=null, projectID=null }) {
    const { respondentsMeta, setRespondentsMeta } = useRespondents();
    const [data, setData] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [axis, setAxis] = useState('');
    const [legendOptions, setLegendOptions] = useState([]);
    const [legendLabels, setLegendLabels] = useState([]);
    const [subcategories, setSubcategories] = useState([])
    const [legend, setLegend] = useState('');

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
    }, [])

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
    if (loading || !chartData) return <p>Loading...</p>;
    return(
        <div>
            <BarChart width={600} height={300} data={chartData}>
                <XAxis dataKey="ag" tick={{fill: '#fff'}}/>
                <YAxis tick={{fill: '#fff'}}/>
                <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                <Legend />
                {['', 'targets'].includes(legend) && <Bar dataKey="count" fill="#fff" name="Acheivement" />}
                {subcategories.map((key) => (
                    <Bar key={key} dataKey={key} fill={getRandomColor()}/>
                ))}
                {legend === 'targets' && <Bar dataKey="target" fill="#ec7070" name="Target" />}
            </BarChart>

            <SimpleSelect name='legend' optionValues={legendOptions} optionLabels={legendLabels} callback={(val) => setLegend(val)} value={legend} />
            <SimpleSelect name='axis' optionValues={['month']} optionLabels={['By Month']} callback={(val) => setAxis(val)} value={axis} />
            
            <Checkbox label='Show Filters?' name="filters" checked={showFilters} callback={(c) => setShowFilters(c)} />
            {showFilters && <div>
                <h3>Filters</h3>
                <div className={styles.filters}>
                <SimpleSelect name='sex' optionValues={respondentsMeta.sexs} optionLabels={respondentsMeta.sex_labels} callback={(val) => setFilters(prev => ({...prev, sex: val}))} />
                <SimpleSelect name='age_range' optionValues={respondentsMeta.age_ranges} optionLabels={respondentsMeta.age_range_labels} callback={(val) => setFilters(prev => ({...prev, age_range: val}))} />
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
