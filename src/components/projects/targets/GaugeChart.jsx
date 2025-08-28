import { PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import theme from '../../../../theme/theme';
import styles from './targets.module.css';

export default function GaugeChart({ target, achievement }){
    /*
    Simple gauge chart component for use with a target card that shows progress against the target.
    - target (integer): the target amount to be achieved
    - achievement (integer): the current amount achieved
    */

    //quickly restructure data for rechart
    const data = [
        { name: 'Acheivement', value: achievement },
        { name: 'Remainder', value: target - achievement }
    ];
    return(
        <div className={styles.chartContainer}>
            <div className={styles.chart}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart width={500} height={260}>
                        {/* set angle to 180 and inner radius so it looks like a gauge chart (half circle) */}
                        <Pie
                            startAngle={180} 
                            endAngle={0}
                            innerRadius="55%"
                            data={data}
                            dataKey="value"
                            labelLine={false}
                            stroke={false}
                            isAnimationActive={false}
                            cy="70%"
                        >
                            <Cell fill={theme.colors.bonasoMain} />
                            <Cell fill='white' />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartLabel}>
                <h2>{target === 0 ? 0 : Math.round((achievement/target)*100)}%</h2>
                <p>{achievement} of {target}</p>
            </div>
        </div>
    )
}