import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import monthlyCounts from './monthlyCounts'
import ComponentLoading from '../loading/ComponentLoading';

export default function ActivityChart({ profile, showTargets=false }) {
    const [data, setData] = useState(null);
    const [chartData, setChartData] = useState(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {   
        const getProfileActivity = async() => {
            if(!profile) return;
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/profiles/users/activity/${profile?.id}/chart/`);
                if(response.ok){
                    const data = await response.json();
                    const titledData = {interactions: data};
                    setData(titledData);
                    setChartData(monthlyCounts(titledData, showTargets));
                    setLoading(false)
                }
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false)
            }
        }
        getProfileActivity();
    }, [profile])

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

    if(loading) return <ComponentLoading />
    return(
        <ResponsiveContainer width="100%" height={300}>
        <BarChart width={600} height={300} data={chartData}>
            <XAxis dataKey="ag" tick={{fill: '#fff'}}/>
            <YAxis tick={{fill: '#fff'}}/>
            <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" fill="#fff" name="Activity" />
        </BarChart>
        </ResponsiveContainer>
    )
}
