import cleanLabels from "../../../../services/cleanLabels";
import styles from './dashboard.module.css';
//build a data table based on rechart data
export default function DataTable({ data, map, breakdown1=null, breakdown2=null, sortMap=null }) {
    /*
    Component that displays a data table beneath a chart. Specifically designed to work with data prepared for that chart.
    - data(array): data from the chart
    - map (object): object containing a map of the options/labels to display readable labels
    - breakdown 1 (string, optional): the name of the legend category (alternatively indicator/target)
    - breakdown 2 (string, optional): the name of the stack category
    - sortMap (object, optional): used for sorting indicators so they appear in the order they do in the assessment (if applicable)
    */
    

    const getBreakdowns = (key) => key.split("__");
    
    //get a list of the columns (by going through the data array and picking the labels)
    const columns = Object.keys(data[0] || {})
        .filter((k) => k !== "period")
        .map(getBreakdowns);

    console.log(map)
    let uniqueBreakdown1 = [...new Set(columns.map(([b1]) => b1))];
    let uniqueBreakdown1Labels = [...new Set(columns.map(([b1]) => b1))]; //seperate out labels, since some breakdowns may not have values in map
    if(breakdown1 && breakdown1 != 'option' && breakdown1 != 'indicator' && breakdown1 != 'Target'){ //these categories will not have values in map
        uniqueBreakdown1Labels = uniqueBreakdown1.map((val) => (map?.[breakdown1]?.find(v => v.value == val)?.label ?? val)) //if applicable, try to find the value in the map and get the label
    }
    //use the indicator order
    if(breakdown1 == 'indicator'){
        uniqueBreakdown1 = uniqueBreakdown1.sort((a, b) => (sortMap[a] - sortMap[b]))
        uniqueBreakdown1Labels = uniqueBreakdown1Labels.sort((a, b) => (sortMap[a] - sortMap[b]))
    }
    
    let uniqueBreakdown2 = [...new Set(columns.map(([, b2]) => b2).filter(Boolean))]; //seperate out labels, since some breakdowns may not have values in map
    let uniqueBreakdown2Labels = [...new Set(columns.map(([, b2]) => b2).filter(Boolean))];
    if(breakdown2 && breakdown2 != 'option'){ //these categories will not have values in map
        uniqueBreakdown2Labels = uniqueBreakdown2.map((val) => (map?.[breakdown2]?.find(v => v.value == val)?.label ?? val)) //if applicable, try to find the value in the map and get the label
    }

    return (
        <div className={styles.tableCont}>
        <table>
            <thead>
                <tr>
                <th rowSpan={breakdown2 ? 2 : 1}>Period</th>
                {breakdown2 ? (
                    uniqueBreakdown1Labels.map((b1) => (
                    <th key={b1} colSpan={uniqueBreakdown2.length}>{b1}</th>
                    ))
                ) : (
                    uniqueBreakdown1Labels.map((b1) => <th key={b1}>{cleanLabels(b1)}</th>)
                )}
                </tr>
                {breakdown2 && (
                <tr>
                    {uniqueBreakdown1Labels.map((b1) =>
                    uniqueBreakdown2Labels.map((b2) => (
                        <th key={`${b1}__${b2}`}>{cleanLabels(b2)}</th>
                    ))
                    )}
                </tr>
                )}
            </thead>

            <tbody>
                {data.map((row) => (
                <tr key={row.period}>
                    <td>{row.period}</td>
                    {breakdown2
                    ? uniqueBreakdown1.flatMap((b1) =>
                        uniqueBreakdown2.map((b2) => (
                            <td key={`${b1}__${b2}`}>{row[`${b1}__${b2}`] ?? 0}</td>
                        ))
                        )
                    : uniqueBreakdown1.map((b1) => (
                        <td key={b1}>{row[b1] ?? 0}</td>
                        ))}
                </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}