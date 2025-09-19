import { useEffect, useState } from 'react';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Loading from '../../reuseables/loading/Loading';
import { AvgTimeChart, MostRequested7d, AvgTimeChart7d } from './RequestsChart';

import styles from './hackerStyles.module.css';

import { IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";

export default function SiteAnalytics(){
    const [hackerData, setHackerData] = useState([]);

    const [showStatus, setShowStatus] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);



    useEffect(() => {
        const getData = async() => {
            try{
                console.log('fetching hacker data...');
                const response = await fetchWithAuth('/api/analysis/meta/site-analytics/');
                const data = await response.json();
                data.forEach(r => {
                    r.path = r.path.replace(/\/\d+(?=\/|$)/g, "/:id");
                });
                setHackerData(data);
                console.log(data)
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.']);
                console.error(err);
            }
            finally{
                setLoading(false);
            }
        }
        getData();
    }, [])

    //list of bad requests from the previous 24 hours (for identifying potential hotfixes)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const badRequest = hackerData.filter((r) => (![200, 201, 207, 204, 401].includes(r.status_code) && new Date(r.timestamp) >= oneDayAgo));

    if(loading) return <Loading />
    return(
        <div>
            <div className={styles.dropdownSegment}>
                <div className={styles.toggleDropdown} onClick={() => setShowStatus(!showStatus)}>
                    <h3 style={{ textAlign: 'start'}}>{`${badRequest.length} bad requests`}</h3>
                    {showStatus ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                    <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                </div>

                {showStatus && <div>
                    {badRequest.length > 0 ? badRequest.map(r => (<div>
                        <p>{r.path} ({r.status_code})</p>
                    </div>)) : <p>No bad requsets...</p>}
                </div>}
            </div>

            <AvgTimeChart data={hackerData} />
            <AvgTimeChart7d data={hackerData.filter(r => (new Date(r.timestamp) >= oneWeekAgo))} />
            <MostRequested7d data={hackerData.filter(r => (new Date(r.timestamp) >= oneWeekAgo))} />
            
        </div>
    )
}