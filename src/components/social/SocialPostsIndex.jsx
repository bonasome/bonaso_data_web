import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useAuth } from '../../contexts/UserAuth'
import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import { useSocialPosts } from '../../contexts/SocialPostsContext';
import { Link } from 'react-router-dom';

function PostCard({ post, callback = null, callbackText }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={expanded ? styles.expandedCard : styles.card}>
            <Link to={`/social/${post.id}`} style={{display:'flex', width:"fit-content"}}><h2>{post.name}</h2></Link>
            {callback && (
                <button type="button" onClick={(e) => { e.stopPropagation(); callback(indicator); }}>
                    {callbackText}
                </button>
            )}
            {expanded && active && (
                <>
                    <p>{post.description}</p>
                </>
            )}
        </div>
    );
}

export default function SocialPostsIndex({ callback=null, callbackText='Add Post', updateTrigger=null }){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { socialPosts, setSocialPosts } = useSocialPosts();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const url = `/api/social/posts/?search=${search}&page=${page}`
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setSocialPosts(data.results);
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setLoading(false)
            }
        };
        loadPosts();
    }, [page, search, updateTrigger]);

    //const visibleIndicators = indicators?.filter(ind => !blacklist.includes(ind.id)) || [];
    if(loading) return callback ? <ComponentLoading /> : <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Posts' : 'My Posts'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} >
                {['meofficer', 'manager', 'admin'].includes(user.role) && 
                    <Link to='/social/new'><button>Record a New Post</button></Link>} 
                {socialPosts?.length === 0 ? 
                    <p>No posts match your criteria.</p> :
                    socialPosts.map(post => (
                        <PostCard key={post.id} post={post} callback={callback ? (indicator)=> callback(indicator) : null} callbackText={callbackText} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}