import styles from './navbar.module.css';
import bonasoWhite from '../assets/bonasoWhite.png';
import { useAuth } from '../contexts/UserAuth';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TfiMenu } from "react-icons/tfi";

function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return width;
}

function Hover({ options }){
    if(!options || options == 'none') return;
    if(options=='user'){
        return(
            <div className={styles.onHoverMenu}>
                <div className={styles.triangle}></div>
                <div className={styles.onHoverLinks}>
                    <div className={styles.hoverLink}>
                        <a href='/users/profile'>Profile</a>
                    </div>
                    <div className={styles.hoverLink}>
                        <a href='/users/logout'>Logout</a>
                    </div>
                </div>
            </div>
        )
    }
}

function ThinMenu() {
    const { user } = useAuth();

    return(
        <div className={styles.menuExpanded}>
            <div className={styles.menuBar}><Link to='/respondents'>Respondents</Link></div>
            <div className={styles.menuBar}><Link to={'/projects'}>Projects</Link></div>
            <div className={styles.menuBar}>{['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/batch-record'}>Batch Record</Link>}</div>
            <div className={styles.menuBar}>{['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/organizations'}>Organizations</Link>}</div>
            <div className={styles.menuBar}>{['admin'].includes(user.role) && <Link to={'/indicators'}>Indicators</Link>}</div>
            <div className={styles.menuBar}><Link to={'/profile'}>Profile</Link></div>
            <div className={styles.menuBar}><Link to={'/logout'}>Logout</Link></div>
        </div>
    )
}

export default function Navbar() {
    const width = useWindowWidth();
    const [menuExpanded, setMenuExpanded] = useState(false);
    const { user } = useAuth();
    const containerRef = useRef(null);
    const [hover, setHover] = useState({
        respondents: false,
        projects: false,
        user: false,
    })
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setMenuExpanded(false);
            }
        };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [])

    return(
        <div className={styles.navbar}>
            <div className={width > 1100 ? styles.header : styles.wideHeader}>
                <Link to='/'><img src={bonasoWhite} className={styles.headerLogo} /></Link>
                <div className={styles.headerText}>
                    <h2>BONASO Data Portal</h2>
                    <h5 className={styles.subheader}>Empowering Botswana's HIV/AIDS Response since 1997</h5>
                </div>
            </div>
                {width > 1100 ?
                    <div className={styles.menu}>
                    <Link to='/respondents'>Respondents</Link>
                    <Link to={'/projects'}>Projects</Link>
                    {['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/batch-record'}>Batch Record</Link>}
                    {['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/organizations'}>Organizations</Link>}
                    {['admin'].includes(user.role) && <Link to={'/indicators'}>Indicators</Link>}
                    <div className={styles.profile} onMouseEnter={()=>setHover({...hover, user: true})}
                        onMouseLeave={()=>setHover({...hover, user: false})}> 
                        <h4 className={styles.profileText}>
                            {user.username && user.username.charAt(0).toUpperCase()}
                        </h4>
                        {hover.user ? <Hover options={'user'} /> : <Hover options={'none'} /> }
                    </div>
                </div> :
                <div className={styles.slimMenu} ref={containerRef}>
                    <TfiMenu onClick={() => setMenuExpanded(!menuExpanded)}/>
                    {menuExpanded && <ThinMenu />}
                </div>
                }
                
        </div>
    )
}