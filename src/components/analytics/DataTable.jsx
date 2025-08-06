import cleanLabels from "../../../services/cleanLabels";
//build a data table based on rechart data
export default function DataTable({ data, breakdown1, breakdown2, map }) {
    //data - the data
    //breakdown 1 -the name of the legend (alternatively indicator/target)
    //breakdown 2 - the name of the stack
    //map - the options/labels map to clean up the labels

    const getBreakdowns = (key) => key.split("__");
    
    const columns = Object.keys(data[0] || {})
        .filter((k) => k !== "period")
        .map(getBreakdowns);


    let uniqueBreakdown1 = [...new Set(columns.map(([b1]) => b1))];
    if(breakdown1 && breakdown1 != 'subcategory' && breakdown1 != 'indicator' && breakdown1 != 'Target'){
        uniqueBreakdown1 = uniqueBreakdown1.map((val) => (map?.[breakdown1]?.[val] ?? val))
    }
    let uniqueBreakdown2 = [...new Set(columns.map(([, b2]) => b2).filter(Boolean))];
    if(breakdown2 && breakdown2 != 'subcategory'){
        uniqueBreakdown2 = uniqueBreakdown2.map((val) => (map?.[breakdown2]?.[val] ?? val))
    }

    return (
        <table>
            <thead>
                <tr>
                <th rowSpan={breakdown2 ? 2 : 1}>Period</th>
                {breakdown2 ? (
                    uniqueBreakdown1.map((b1) => (
                    <th key={b1} colSpan={uniqueBreakdown2.length}>{b1}</th>
                    ))
                ) : (
                    uniqueBreakdown1.map((b1) => <th key={b1}>{cleanLabels(b1)}</th>)
                )}
                </tr>
                {breakdown2 && (
                <tr>
                    {uniqueBreakdown1.map((b1) =>
                    uniqueBreakdown2.map((b2) => (
                        <th key={`${b1}__${b2}`}>{b2}</th>
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
    );
}