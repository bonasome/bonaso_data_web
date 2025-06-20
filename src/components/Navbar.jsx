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
    const { user } = useAuth();
    if(!options || options == 'none') return;
    if(options=='user'){
        return(
            <div className={styles.onHoverMenu}>
                <div className={styles.triangle}></div>
                <div className={styles.onHoverLinks}>
                    <div className={styles.hoverLink}>
                        <Link to={`/profiles/${user.id}`}>Profile</Link>
                    </div>
                    <div className={styles.hoverLink}>
                        <Link href='/users/logout'>Logout</Link>
                    </div>
                </div>
            </div>
        )
    }
    if(options == 'projects' && user.role == 'admin'){
         <div className={styles.onHoverMenu}>
            <div className={styles.triangle}></div>
            <div className={styles.onHoverLinks}>
                <div className={styles.hoverLink}>
                    <Link to={`/organizations`}>Organizations</Link>
                </div>
                <div className={styles.hoverLink}>
                    <Link href='/indicators'>Indicators</Link>
                </div>
            </div>
        </div>
    }
}


function Dropdown({ name }){
    const [labels, setLabels] = useState([]);
    const [urls, setUrls] = useState([]);
    const { user } = useAuth();
    useEffect(() => {
        if(name =='Projects' && user.role == 'admin'){
            setUrls(['/projects', '/indicators', '/organizations'])
            setLabels(['Manage Projects', 'Manage Indicators', 'Manage Organizations'])
        }
        if(name =='Respondents' && ['meofficer', 'manager', 'admin'].includes(user.role)){
            setUrls(['/respondents', '/batch-record'])
            setLabels(['Manage Respondents', 'Batch Record'])
        }
        if(name ==`${user.username}`){
            setUrls([`/profiles/${user.id}`, '/users/logout'])
            setLabels(['My Profile', 'Logout'])
        }
        if(name=='Team'){
            setUrls(['/profiles/new'])
            setLabels(['Add a New User'])
        }
    }, [])
    return(
        <div className={styles.expandedMenuDropdown}>
            {urls.map((url, index) => (
                <div key={url} className={styles.expandedDropdownLink}>
                    <Link to={url}>{labels[index]}</Link> 
                </div>
            ))}
        </div>
    )
}


function MenuLink({ name, url }) {
    const { user } = useAuth();
    const [active, setActive] = useState(false);
    if(name == 'Projects' && !['meofficer', 'manager', 'admin'].includes(user.role)){
        return <></>
    }
    if(name == 'Team' && !['meofficer', 'manager', 'admin'].includes(user.role)){
        return <></>
    }
    return(
        <div className={styles.expandedMenuLink} onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)}>
            <Link to={url}>{name}</Link>
            {active && <Dropdown name={name} />}
        </div>
    )
}

function ExpandedMenu() {
    const { user } = useAuth();
    const links = ['Projects', 'Respondents', 'Team', `${user.username}`]
    const urls = ['/projects', '/respondents', '/profiles', `/profiles/${user.id}`]

    return(
        <div className={styles.expandedMenu}>
            {links.map((l, index) => (<MenuLink name={l} url={urls[index]} />))}
        </div>
    )
}

function ThinMenu() {
    const { user } = useAuth();

    return(
        <div className={styles.menuExpanded}>
            <div className={styles.menuBar}><Link to='/respondents'>Respondents</Link></div>
            <div className={styles.menuBar}>{['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/projects'}>Projects</Link>}</div>
            <div className={styles.menuBar}>{['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/batch-record'}>Batch Record</Link>}</div>
            <div className={styles.menuBar}>{['admin', 'meofficer', 'manager'].includes(user.role) && <Link to={'/organizations'}>Organizations</Link>}</div>
            <div className={styles.menuBar}>{['admin'].includes(user.role) && <Link to={'/indicators'}>Indicators</Link>}</div>
            <div className={styles.menuBar}><Link to={`/profiles/${user.id}`}>Profile</Link></div>
            <div className={styles.menuBar}><Link to={'/users/logout'}>Logout</Link></div>
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
                <Link to='/'><div className={styles.headerText}>
                    <h2>BONASO Data Portal</h2>
                    <h5 className={styles.subheader}>Empowering Botswana's HIV/AIDS Response since 1997</h5>
                </div></Link>
            </div>
                {width > 1100 ?
                    <ExpandedMenu /> :
                <div className={styles.slimMenu} ref={containerRef}>
                    <TfiMenu onClick={() => setMenuExpanded(!menuExpanded)}/>
                    {menuExpanded && <ThinMenu />}
                </div>
                }
                
        </div>
    )
}