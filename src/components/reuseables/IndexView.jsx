import React from 'react';
import { useEffect, useState } from 'react';

import useWindowWidth from '../../../services/useWindowWidth';

import { GrLinkPrevious, GrLinkNext } from "react-icons/gr";
import { FaSearch } from "react-icons/fa";
//index view wrapper that handles setting pages and controlling search inputs
export default function IndexViewWrapper({ children, page, onSearchChange, onPageChange, entries, filter=null }){
    /*
    Helpful wrapper that surrounds an index component and handles things like search/pages. Passes that information
    back up to the parent so the correct API request can be made.
    - children (component): the index component this is wrapping around
    - page (integer): the current page the user is on
    - onSearchChange (function): function to run when user types in search bar
    - onPageChange (function): function to run when user clicks a page forward/backward button
    - entries (integer): total number of entries for cal
    */

    const width = useWindowWidth(); //used to remove page button text on small screens
    const [totalPages, setTotalPages] = useState(1);

    //calculate total number of pages. the backend sends paginated lists of 20 items at a time. 
    //make sure you change this if you change the server pagination settings
    useEffect(() => {
        const pages = Math.ceil(entries / 20) == 0 ? 1 : Math.ceil(entries / 20);
        setTotalPages(pages)
    }, [entries])

    const handleSearch = (val) => {
        onSearchChange?.(val); // optional chaining in case the prop isn't passed
        onPageChange?.(1); // tell parent we moved to page 1
    };

    const handlePageChange = (newPage) => {
        onPageChange?.(newPage);
    };

    return( 
        <div >
            <div>
                <FaSearch style={{marginLeft: 15, marginRight: 10}} />
                <input type='text' onChange={(e) => handleSearch(e.target.value)} placeholder={'start typing to search'}/>
                {filter && filter}
            </div>

            { children }

            <div>
                <button type="button" onClick={() => handlePageChange(page - 1)} 
                    disabled={page === 1}><GrLinkPrevious style={{ marginRight: 5}}/> {width > 678 && 'Previous Page'}</button>
                    <span>Showing Page {page} of {totalPages}</span>
                <button type="button" onClick={() => handlePageChange(page + 1)} 
                    disabled={page === totalPages}>{width > 678 && 'Next Page'}<GrLinkNext style={{ marginLeft: 5}}/></button>
            </div>
        </div>
    )
}

//<button type="button" onClick={handleSearch}><FaSearch /> Search</button>