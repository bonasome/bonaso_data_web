import React from 'react';
import { useEffect, useState } from 'react';

export default function IndexViewWrapper({ children, onSearchChange, onPageChange, entries={entries} }){
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    useEffect(() => {
        const pages = Math.ceil(entries / 20) == 0 ? 1 : Math.ceil(entries / 20);
        setTotalPages(pages)
    }, [entries])

    const handleSearch = () => {
        onSearchChange?.(search); // optional chaining in case the prop isn't passed
        setPage(1); // reset to first page on new search
        onPageChange?.(1); // tell parent we moved to page 1
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        onPageChange?.(newPage);
    };

    return( 
        <div >
            <div>
                <input type='text' onChange={(e) => setSearch(e.target.value)}/>
                <button onClick={handleSearch}>Search</button>
            </div>
            { children }
            <div>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Previous Page</button>
                <span>Showing Page {page} of {totalPages}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next Page</button>
            </div>
        </div>
    )
}