import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import { useInteractions } from '../../../contexts/InteractionsContext';
import monthlyCounts from './monthlyCounts'
const data = [
  { name: 'Org A', value: 80 },
  { name: 'Org B', value: 120 },
  { name: 'Org C', value: 100 },
];

const target = 100;

export default function IndicatorChart({ indicator, showTargets=true }) {
    const [data, setData] = useState(null);
    const [chartData, setChartData] = useState(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getInteractions = async() => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/indicators/chart-data/?indicator=${indicator.id}`);
                const data = await response.json();
                setData(data);
                console.log(data)
                setChartData(monthlyCounts(data[0], showTargets));
                setLoading(false)
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false)
            }
        }
        getInteractions();
    }, [indicator])

    useEffect(() => {
        if(data?.length > 0){
            setChartData(monthlyCounts(data[0], showTargets));
        }
    }, [data, showTargets])

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

    if(loading) return <p>Loading...</p>
    return(
        <BarChart width={600} height={300} data={chartData}>
            <XAxis dataKey="month" tick={{fill: '#fff'}}/>
            <YAxis tick={{fill: '#fff'}}/>
            <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" fill="#fff" name="Acheivement" />
            {showTargets && <Bar dataKey="target" fill="#ec7070" name="Target" />}
        </BarChart>
    )
}
