import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';

export default function IndicatorChart() {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [params, setParams] = useState([]) //['age_range', 'sex', 'kp_type', 'disability_type', 'citizenship', 'hiv_status', 'pregnancy']
    const [split, setSplit] = useState('') //'month' || 'quarter'
    useEffect(() => {
        const getData = async () => {
            try {
                console.log('fetching data...');
                const paramsQuery = params.map((p) => (`${p}=true`)).join('&')
                const splitQuery = `&split=${split}`
                const url = `/api/analysis/aggregate/1/?${paramsQuery}${splitQuery}`
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    console.log(data)
                    setChartData(data)
                }
                else{
                    console.error(data);
                    setErrors(['Something went wrong. Please try again later.'])
                }
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        }
        getData();
    }, [params, split])
    const download = async () => {
        const response = await fetchWithAuth(`/api/analysis/download-indicator-aggregate/1/?sex=true&age_range=true&split=quarter`,);

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
    return(
        <div>
            <p>My big fat ass</p>
        </div>
    )
}