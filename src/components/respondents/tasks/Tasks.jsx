import React, { useState, useEffect } from "react";
import fetchWithAuth from '../../../../services/fetchWithAuth';
import IndexViewWrapper from "../../reuseables/IndexView";

function TaskCard({ task }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div onClick={() => setExpanded(!expanded)}>
            <h3>{task.indicator.code}: {task.indicator.name}</h3>
            {expanded && (
                <div>
                    <p>{task.indicator.description}</p>
                    <p>{task.indicator.prerequisite && `Prerequisite Task: ${task.indicator.prerequisite.code +': '+ task.indicator.prerequisite.name }`}</p>

                    {task.indicator.subcategories && task.indicator.subcategories.length > 0 && (
                        <div>
                            <p>Subcategories:</p>
                            <ul>
                                {task.indicator.subcategories.map((cat, index) => (
                                    <li key={index}>{cat.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <p>{task.indicator.require_numeric ? 'Requires Number' : ''}</p>
                </div>
            )}
        </div>
    );
}

export default function Tasks({ callback }) {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);

    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/manage/tasks/?search=${search}`);
                const data = await response.json();
                setTasks(data.results);
                setEntries(data.count); 
                if (page === 1) {
                    setTasks(data.results);
                } 
                else {
                    setTasks(prev => [...prev, ...data.results]);
                }
                if(callback){
                    callback(data.results)
                }
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
            } 
            finally {
                setLoading(false);
            }
        };
        getTasks();
    }, [search, page]);

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h4>My Tasks</h4>
            <IndexViewWrapper onSearchChange={setSearch} onPageChange={setPage} entries={entries}>
            {tasks.map((task) => (
                <TaskCard task={task} key={task.id} />
            ))}
            </IndexViewWrapper>
        </div>
    );
}