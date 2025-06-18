import styles from './loading.module.css'
import bonasoWhite from '../../assets/bonasoWhite.png'

export default function Loading(){
    return(
        <div className={styles.loading}>
            <img src={bonasoWhite} className={styles.loadingImage} />
            <h2>Loading</h2>
            <div className={styles.loadingDots}>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
}