import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import prettyDates from '../../../../services/prettyDates';
import cleanLabels from '../../../../services/cleanLabels';
import { getContentTypeLabel } from '../../../../services/modelMap';

import theme from '../../../../theme/theme';

export function FlagTrendChart({ data }) {
    //add readable month field
    const cleanedData = data.map(d => ({
        ...d,
        monthLabel: prettyDates(d.month, false, true),
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            console.log(payload)
            const { monthLabel, count } = payload[0].payload;
            return (
                <div style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: '8px', border: '1px solid #ccc' }}>
                    <strong>{monthLabel}</strong>: {count}
                </div>
            );
        }
        return null;
    };
    if(cleanedData.length === 0) return <p>No data yet!</p>
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cleanedData}>
                <XAxis dataKey="monthLabel" tick={{ fill: 'white'}}/>
                <YAxis allowDecimals={false}  tick={{ fill: 'white'}} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="count" fill="#8884d8" name="Flag Count" />
            </LineChart>
        </ResponsiveContainer>
    );
}
export function FlagTypeChart({ data, field }) {
    //add cleaned label field
    console.log(data)
    const cleanedData = data.map(d => ({
        ...d,
        label: field ==='content_type' ? getContentTypeLabel(`${d.app_label}.${d.model}`) : cleanLabels(d[field]),
    }));

    //generate slice colors
    const getColor = (index) => {
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
                return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        }
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { label, count } = payload[0].payload;
            return (
                <div style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: '8px', border: '1px solid #ccc' }}>
                    <strong>{label}</strong>: {count}
                </div>
            );
        }
        return null;
    };
    if(cleanedData.length === 0) return <p>No data yet!</p>
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart width={400} height={400}>
                <Pie
                    data={cleanedData}
                    cx="50%" // center x
                    cy="50%" // center y
                    labelLine={false}
                    label={({ label , percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="count"
                >
                    {data.map((entry, index) => (
                    <Cell key={entry[field]} fill={getColor(index)} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                </PieChart>
        </ResponsiveContainer>
    );
}