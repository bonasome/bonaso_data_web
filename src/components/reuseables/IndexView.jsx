import React from 'react';
import { useEffect, useState } from 'react';

import { GrLinkPrevious, GrLinkNext } from "react-icons/gr";
import { FaSearch } from "react-icons/fa";
//index view wrapper that handles setting pages and controlling search inputs
export default function IndexViewWrapper({ children, page, onSearchChange, onPageChange, entries, filter=null }){
    const [search, setSearch] = useState('');
    //const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    useEffect(() => {
        const pages = Math.ceil(entries / 20) == 0 ? 1 : Math.ceil(entries / 20);
        setTotalPages(pages)
    }, [entries])

    const handleSearch = (val) => {
        onSearchChange?.(val); // optional chaining in case the prop isn't passed
        //setPage(1); // reset to first page on new search
        onPageChange?.(1); // tell parent we moved to page 1
    };

    const handlePageChange = (newPage) => {
        onPageChange?.(newPage);
        //setPage(newPage);
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
                    disabled={page === 1}><GrLinkPrevious style={{ marginRight: 5}}/> Previous Page</button>
                    <span>Showing Page {page} of {totalPages}</span>
                <button type="button" onClick={() => handlePageChange(page + 1)} 
                    disabled={page === totalPages}>Next Page<GrLinkNext style={{ marginLeft: 5}}/></button>
            </div>
        </div>
    )
}

//<button type="button" onClick={handleSearch}><FaSearch /> Search</button>