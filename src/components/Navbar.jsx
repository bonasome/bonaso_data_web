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


function Dropdown({ name }){
    const [labels, setLabels] = useState([]);
    const [urls, setUrls] = useState([]);
    const { user } = useAuth();
    useEffect(() => {
        if(name =='Projects' && user.role == 'admin'){
            setUrls(['/projects', '/indicators', '/organizations', '/clients'])
            setLabels(['Manage Projects', 'Manage Indicators', 'Manage Organizations', 'Manage Clients'])
        }

        if(name =='Record' && ['meofficer', 'manager', 'admin'].includes(user.role)){
            let urls = ['/respondents', '/batch-record', '/events', '/social']
            let labels = ['Manage Respondents', 'Batch Record', 'Record Events', 'Record Social Post']
            setUrls(urls)
            setLabels(labels)
        }
        if(name =='Analyze' && ['meofficer', 'manager', 'admin', 'client'].includes(user.role)){
            let urls = ['/analytics', '/flags']
            let labels = ['View Dashboards', 'View Flags']
            setUrls(urls)
            setLabels(labels)
        }
        if(name=='Team'){
            setUrls(['/profiles', '/profiles/new'])
            setLabels(['My Team', 'Add a New User'])
        }
        if(name ==`${user.username}`){
            setUrls([`/profiles/${user.id}`, '/messages', '/help', '/users/logout'])
            setLabels(['My Profile', 'Messages', 'Help', 'Logout'])
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
    if(name == 'Projects' && !['meofficer', 'manager', 'admin', 'client'].includes(user.role)){
        return <></>
    }
    if(name == 'Analyze' && !['meofficer', 'manager', 'admin', 'client'].includes(user.role)){
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
    const links = ['Analyze', 'Record', 'Projects','Team', `${user.username}`]
    const urls = ['/analytics', '/respondents', '/projects', '/profiles', `/profiles/${user.id}`]

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
            <h2>Record</h2>
            <div className={styles.menuBar}><Link to='/respondents'>Respondents</Link></div>
            {!['clients'].includes(user.role) && <div className={styles.menuBar}><Link to='/respondents/flagged'>Flagged Interactions</Link></div>}
            {['admin', 'meofficer', 'manager'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/batch-record'}>Batch Record</Link></div>}
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/events'}>Events</Link></div>}
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/social'}>Social</Link></div>}
            
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <h2>Analyze</h2>}
            {['admin', 'manager', 'meofficer'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/analytics'}>Dashboards</Link></div>} 
            
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <h2>Projects</h2>}
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/projects'}>Projects</Link></div>}
            {['admin', 'meofficer', 'manager'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/organizations'}>Organizations</Link></div>}
            {['admin'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/indicators'}>Indicators</Link></div>}
            {['admin'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/clients'}>Clients</Link></div>}

            {['admin', 'meofficer', 'manager'].includes(user.role) && <h2>Team</h2>}
            {['admin', 'manager', 'meofficer'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/profiles'}>My Team</Link></div>} 

            
            
            <h2>Profile</h2>
            <div className={styles.menuBar}><Link to={`/profiles/${user.id}`}>Profile</Link></div>
            <div className={styles.menuBar}><Link to={`/messages`}>Messages</Link></div>
            <div className={styles.menuBar}><Link to={'/users/logout'}>Logout</Link></div>
            <div className={styles.menuBar}><Link to={`/help`}>Help</Link></div>
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
                    {width > 500 && <h5 className={styles.subheader}>Empowering Botswana's HIV/AIDS Response since 1997</h5>}
                </div></Link>
            </div>
                {width >= 1100 ?
                    <ExpandedMenu /> :
                <div className={styles.slimMenu} ref={containerRef}>
                    <TfiMenu className={styles.hamburger} onClick={() => setMenuExpanded(!menuExpanded)}/>
                    {menuExpanded && <ThinMenu />}
                </div>
                }
                
        </div>
    )
}