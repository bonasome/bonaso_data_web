import { useState } from 'react'; 
import { LineChart, BarChart, Bar, Line, Legend, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import prettyDates from '../../../../services/prettyDates';
import getColor from '../../../../services/getColor';
import cleanLabels from '../../../../services/cleanLabels';
import { getContentTypeLabel } from '../../../../services/modelMap';

import theme from '../../../../theme/theme';

export function AvgTimeChart({ data }) {

    const grouped = data.reduce((acc, log) => {
        if (!acc[log.path]) acc[log.path] = [];
        acc[log.path].push(log.response_time_ms);
        return acc;
    }, {});

    // Convert to Recharts format
    const chartData = Object.entries(grouped).map(([path, times]) => {
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        return { path, avgResponseTime: avg };
    }).sort((a, b) => b.avgResponseTime - a.avgResponseTime); ;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { path, avgResponseTime } = payload[0].payload;
            return (
                <div style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: '8px', border: '1px solid #ccc' }}>
                    <strong>{path}</strong>: {Math.round(avgResponseTime)}ms ({Number((avgResponseTime/1000).toFixed(2))}s)
                </div>
            );
        }
        return null;
    };
    if(chartData.length === 0) return <p>No data yet!</p>
    return (
        <div style={{ margin: '2vh', padding: '5vh', backgroundColor: theme.colors.bonasoUberDarkAccent}}>
            <h3>Average Time to Complete Request (ms)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                    <XAxis  type="number" tick={{ fill: "white"}}/>
                    <YAxis dataKey="path" type="category" tick={{ fill: "white"}} width={200}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgResponseTime" fill={theme.colors.bonasoLightAccent} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function AvgTimeChart7d({ data }) {

    let paths = []
    const grouped = data.reduce((acc, log) => {
        const date = new Date(log.timestamp).toISOString().split("T")[0]; // e.g. "2025-09-19"
        const key = `${log.path}|${date}`; // use a delimiter unlikely to appear in path
        
        if (!acc[key]) acc[key] = [];
        acc[key].push(log.response_time_ms);
        if(!paths.includes(log.path)) paths.push(log.path);
        return acc;
    }, {});
    

    function pivotForRecharts(data) {
        const byDate = {};

        data.forEach(({ path, date, avgResponseTime }) => {
            if (!byDate[date]) {
            byDate[date] = { date };
            }
            byDate[date][path] = avgResponseTime;
        });

        return Object.values(byDate);
    }

    // Convert to Recharts format
    const chartData = Object.entries(grouped).map(([key, times]) => {
        const [path, date] = key.split("|"); // clean split
        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        return { path, date, avgResponseTime: Number(avg.toFixed(2)) };
    });
    
    if(chartData.length === 0) return <p>No data yet!</p>
    return (
        <div style={{ margin: '2vh', padding: '5vh', backgroundColor: theme.colors.bonasoUberDarkAccent}}>
            <h3>Average Time to Complete Request (ms)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pivotForRecharts(chartData)}>
                    <XAxis dataKey="date" tick={{ fill: "white"}} />
                    <YAxis tick={{ fill: "white"}}/>
                    <Tooltip />
                    <Legend />
                    {paths.map((path, i) => (
                        <Line key={path} type="monotone" dataKey={path} stroke={getColor()} dot={false}/>
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function MostRequested7d({ data }) {

    const counts = data.reduce((acc, log) => {
        acc[log.path] = (acc[log.path] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(counts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count); 

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { path, count } = payload[0].payload;
            return (
                <div style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: '8px', border: '1px solid #ccc' }}>
                    <strong>{path}</strong>: {count}
                </div>
            );
        }
        return null;
    };

    if(chartData.length === 0) return <p>No data yet!</p>
    return (
        <div style={{ margin: '2vh', padding: '5vh', backgroundColor: theme.colors.bonasoUberDarkAccent}}>
            <h3>Most Requested Endpoints (7 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" tick={{ fill: "white"}}/>
                    <YAxis type="category" dataKey="path" tick={{ fill: "white"}} width={200} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={theme.colors.bonasoLightAccent} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}