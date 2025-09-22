import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/UserAuth';

import useWindowWidth from '../../services/useWindowWidth';

import styles from './navbar.module.css';
import bonasoWhite from '../assets/bonasoWhite.png';

import { TfiMenu } from "react-icons/tfi";
import { IoMdClose } from "react-icons/io";


function Dropdown({ name }){
    /*
    The dropdown component that appears when the user hovers over the tab.
    - tab (string): name of the tab the user is hovered over. used to determine what URLs to show
    */
    const [labels, setLabels] = useState([]); //labels the user sees
    const [urls, setUrls] = useState([]); //the actual URL the tab will navigate to
    const { user } = useAuth();

    //on hover, calculate what links the user should see based on the tab name and their role
    useEffect(() => {
        if(name =='Projects' && user.role == 'admin'){
            setUrls(['/projects', '/indicators', '/organizations', '/clients'])
            setLabels(['Manage Projects', 'Manage Indicators', 'Manage Organizations', 'Manage Clients'])
        }
        if(name== 'Projects' && ['meofficer', 'manager'].includes(user.role)){
            setUrls(['/projects', '/organizations']);
            setLabels(['View My Projects', 'View My Organizations'])
        }

        if(name =='Record' && ['meofficer', 'manager', 'admin'].includes(user.role)){
            let urls = ['/respondents', '/batch-record', '/events', '/social']
            let labels = ['Manage Respondents', 'Batch Record', 'Record Events', 'Record Social Post']
            setUrls(urls)
            setLabels(labels)
        }
        if(name =='Record' && ['client'].includes(user.role)){
            let urls = ['/respondents','/events', '/social']
            let labels = ['Manage Respondents', 'Record Events', 'Record Social Post']
            setUrls(urls)
            setLabels(labels)
        }
        if(name =='Analyze' && ['meofficer', 'manager', 'client'].includes(user.role)){
            let urls = ['/analytics', '/analytics/tables', '/analytics/lists', '/flags']
            let labels = ['View Dashboards', 'Pivot Tables', 'Line Lists', 'View Flags']
            setUrls(urls)
            setLabels(labels)
        }
        if(name=='Analyze' && user.role == 'admin'){
            let urls = ['/analytics', '/analytics/tables', '/analytics/lists', '/flags', '/analytics/site']
            let labels = ['View Dashboards', 'Pivot Tables', 'Line Lists', 'View Flags', 'Site Analytics']
            setUrls(urls);
            setLabels(labels);
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
    /*
    A singular tab that appears within the navbar. When hovered over it will reveal more links.
    - name (string): the name of the tab, will be used to determine what dropdown links to show
    - url (string/url): the url that the tab should direct the user to when clicked
    */
    const { user } = useAuth();
    const [active, setActive] = useState(false); //is being hovered over by the user

    //optionally show/hide tabs entirely based on role. you can control what specific
    //links are visible on hover in the dropdown component above
    if(name == 'Projects' && !['meofficer', 'manager', 'admin', 'client'].includes(user.role)){
        return <></>
    }
    if(name == 'Analyze' && !['meofficer', 'manager', 'admin', 'client'].includes(user.role)){
        return <></>
    }
    if(name == 'Team' && !['meofficer', 'manager', 'admin', 'client'].includes(user.role)){
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
    /*
    Menu that has dropdown tabs for use when a user's screen is large enough
    */
    const { user } = useAuth();
    //basic tabs
    const links = ['Analyze', 'Record', 'Projects','Team', `${user.username}`]
    //default link to go to when that tab is clicked
    const urls = ['/analytics', '/respondents', '/projects', '/profiles', `/profiles/${user.id}`]

    return(
        <div className={styles.expandedMenu}>
            {/* map throuh each link and generate the appropriate menu link component, which will contain 
            links that appear on hover */}
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
            {['meofficer', 'manager', 'admin'].includes(user.role) && <div className={styles.menuBar}><Link to='/flags'>Flags</Link></div>}
            {['admin', 'meofficer', 'manager'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/batch-record'}>Batch Record</Link></div>}
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/events'}>Events</Link></div>}
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/social'}>Social</Link></div>}
            
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <h2>Projects</h2>}
            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/projects'}>Projects</Link></div>}
            {['admin', 'meofficer', 'manager'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/organizations'}>Organizations</Link></div>}
            {['admin'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/indicators'}>Indicators</Link></div>}
            {['admin'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/clients'}>Clients</Link></div>}

            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <h2>Analyze</h2>}
            {['admin', 'manager', 'meofficer', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/analytics'}>Dashboards</Link></div>} 
            {['admin', 'manager', 'meofficer', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/analytics/tables'}>Pivot Tables</Link></div>} 
            {['admin', 'manager', 'meofficer', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/analytics/lists'}>Line Lists</Link></div>} 
            {user.role == 'admin' && <div className={styles.menuBar}><Link to={'/analytics/site'}>Site Analytics</Link></div>}

            {['admin', 'meofficer', 'manager', 'client'].includes(user.role) && <h2>Team</h2>}
            {['admin', 'manager', 'meofficer'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/profiles'}>My Team</Link></div>} 
            {['admin', 'manager', 'meofficer', 'client'].includes(user.role) && <div className={styles.menuBar}> <Link to={'/profiles/new'}>Add New User</Link></div>} 

            <h2>Profile</h2>
            <div className={styles.menuBar}><Link to={`/profiles/${user.id}`}>Profile</Link></div>
            <div className={styles.menuBar}><Link to={`/messages`}>Messages</Link></div>
            <div className={styles.menuBar}><Link to={'/users/logout'}>Logout</Link></div>
            <div className={styles.menuBar}><Link to={`/help`}>Help</Link></div>
        </div>
    )
}



export default function Navbar() {
    /*
    Navbar that appears at the top of the page. Its content/view will depend on both the user's role
    and the screen width.
    */
    const width = useWindowWidth(); //determine screen size
    const [menuExpanded, setMenuExpanded] = useState(false);
    const containerRef = useRef(null); //helps hide hamburger menu in small screens

    //if using the thin hamburger menu for small screens, make sure that a click outside the navbar closes it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setMenuExpanded(false);
            }
        };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return(
        <div className={styles.navbar}>
            { /* slightly alter header icon/text if the screen is small */}
            <div className={width > 1100 ? styles.header : styles.wideHeader}>
                <Link to='/'><img src={bonasoWhite} className={styles.headerLogo} /></Link>
                <Link to='/'><div className={styles.headerText}>
                    <h2>BONASO Data Portal</h2>
                    {width > 500 && <h5 className={styles.subheader}>Empowering Botswana's HIV/AIDS Response since 1997</h5>}
                </div></Link>
            </div>
                {/* if screen is large, use the Expanded menu component with hoverabel tabs */}
                {width >= 1100 ?
                    <ExpandedMenu /> :
                <div className={styles.slimMenu} ref={containerRef}>
                    {menuExpanded ? <IoMdClose className={styles.hamburger} onClick={() => setMenuExpanded(!menuExpanded)}/> :
                        <TfiMenu className={styles.hamburger} onClick={() => setMenuExpanded(!menuExpanded)}/>}
                    {menuExpanded && <ThinMenu />}
                    {/* otherwise use the collapsable hamburger menu */}
                </div>
                }
                
        </div>
    )
}