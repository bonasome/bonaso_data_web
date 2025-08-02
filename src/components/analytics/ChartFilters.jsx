import { useState, useEffect, useMemo } from "react";

import cleanLabels from "../../../services/cleanLabels";
import fetchWithAuth from "../../../services/fetchWithAuth";

import MultiCheckbox from "../reuseables/inputs/MultiCheckbox";
import ButtonHover from "../reuseables/inputs/ButtonHover";
import ComponentLoading from "../reuseables/loading/ComponentLoading";

import styles from './dashboard.module.css';

import { IoIosArrowDropdownCircle, IoIosArrowDropup } from "react-icons/io";
import { FaFilterCircleXmark } from "react-icons/fa6";

//expandable segment to keep section a bit more ui friendly
function FilterSegment({ options, option, value, callback}){
    const [expanded, setExpanded] = useState(false);
    return(
         <div className={styles.chartSettings}>
            <div className={styles.toggleDropdown} onClick={() => setExpanded(!expanded)}>
                <h3 style={{ textAlign: 'start'}}>{cleanLabels(option)}</h3>
                {expanded ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }}/> : 
                <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
            </div>

            {expanded && <div className={styles.chartFilters}>
                <MultiCheckbox label={cleanLabels(option)} 
                    options={
                        Object.keys(options[option]).map(val => ({'value': val, 'label': options[option][val]}))
                    } 
                    onChange={(vals) => callback(vals)}
                    value={value}
                />
            </div>}
        </div>
    )
}

//component to set filters
export default function ChartFilters({ chart, options, dashboard, onUpdate }){
    const [errors, setErrors] = useState([]);
    const [filters, setFilters] = useState(null);
    const [saving, setSaving] = useState(false);

    //determine if subcategory filters should be allowed and set the options
    const subcategories = useMemo(() => {
        if(!chart) return []
        return chart.chart.indicators.flatMap(ind => 
            ind.subcategories.map(sc => ({ value: sc.id.toString(), label: sc.name }))
        );
    }, [chart]);

    //set the existing filters
    useEffect(() => {
        if (!chart || !options) return;

        let map = {};
        Object.keys(options).forEach(o => {
            map[o] = chart.chart.filters[o] ?? [];
        });

        if(subcategories) map['subcategory'] = chart.chart.filters['subcategory'] ?? [];

        setFilters(map);
    }, [chart, options, subcategories]);
    console.log(options)
    
    //update settings and refresh data on change
    const handleUpdate = async(data) => {
        try{
            console.log('submiting data...', data)
            setSaving(true);
            const response = await fetchWithAuth(`/api/analysis/dashboards/${dashboard.id}/filters/${chart.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({filters: data})
            });

            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData.chart_data);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        console.log(returnData)
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record project: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    
    if(!chart || !options || !filters || saving) return <ComponentLoading />
    return(
        <div className={styles.chartFilters}>
            {options && Object.keys(options).map((o) => (
               <FilterSegment options={options} option={o} value={filters[o]}
                    callback={(vals) => {const updatedFilters = { ...filters, [o]: vals };
                        setFilters(updatedFilters);
                        handleUpdate(updatedFilters);}}/>
            ))}

            {subcategories.length > 0 && filters?.subcategory &&
                <FilterSegment options={options} option={'subcategory'} value={filters.subcategory}
                    callback={(vals) => {const updatedFilters = { ...filters, [o]: vals };
                        setFilters(updatedFilters);
                        handleUpdate(updatedFilters);}}
            />}
            <div style={{ maxWidth: 300 }}>
                <ButtonHover callback={() => handleUpdate({})} noHover={<FaFilterCircleXmark />} hover={'Clear All Filters'} />
            </div>
        </div>
    )

}