import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import IndicatorChart from './IndicatorChart';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    return(
        <div>
            <IndicatorChart />
            <p>My big fat ass</p>
        </div>
    )
}