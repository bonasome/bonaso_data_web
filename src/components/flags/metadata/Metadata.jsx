import { FlagTrendChart, FlagTypeChart } from './FlagCharts';
import styles from '../flags.module.css';

export default function Metadata({ metadata }){
    return(
        <div>
            <div className={styles.section}>
                <div className={styles.count}>
                    <h2>{metadata.active}</h2>
                    <p>Active Flags</p>
                </div>

                <div className={styles.count}>
                    <h2>{(metadata.total - metadata.active)}</h2>
                    <p>Resolved Flags</p>
                </div>
            </div>
            <div className={styles.section}>
                <FlagTrendChart data={metadata.by_month} />
            </div>

            <div className={styles.section}>
                <h3>By Reason</h3>
                <FlagTypeChart data={metadata.by_type} field={'reason_type'} />
            </div>
            <div className={styles.section}>
                <h3>By Data Type</h3>
                <FlagTypeChart data={metadata.by_model} field={'content_type'} />
            </div>
        </div>
    )
}