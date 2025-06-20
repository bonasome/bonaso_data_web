import React from 'react';
import styles from './home.module.css';
import { useAuth } from '../contexts/UserAuth';
import { useTasks } from '../contexts/TasksContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import fetchWithAuth from '../../services/fetchWithAuth';
function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { tasks, setTasks } = useTasks();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    useEffect(() => {
        const getTasks = async () => {
            try {
                console.log('fetching respondent details...');
                const url = `/api/manage/tasks/`
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                const myTasks = data.results.filter(task => task.organization.id == user.id)
                setTasks(myTasks);
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        };
        getTasks();
    }, [])

    return (
        <div className={styles.home}>
            <h1 className={styles.header}>Welcome, {user.username}!</h1>
            <div className={styles.content}>
            <div className={styles.tasksBox}>
                <h2>My Tasks</h2>
                    <div className={styles.tasks}>
                    {tasks.length == 0 && <h3>No tasks, great work!</h3>}
                    {tasks.length > 0 && tasks.map((task) =>  (
                        <div 
                            className={['meofficer', 'admin', 'manager'].includes(user.role) ? styles.taskLink : styles.task}
                            onClick={['meofficer', 'admin', 'manager'].includes(user.role) ? () => navigate(`/projects/${task.project.id}`) : null}
                        >
                            <h3>{task.indicator.code}: {task.indicator.name}</h3>
                            <i>For Project {task.project.name}</i>
                        </div>

                    ))}
                </div>
            </div>
            <div className={styles.actions}>
                <h2>Where should we start today?</h2>
                <Link to={'/respondents'}><button>First time? Check out the tutorial!</button></Link> 
                <Link to={'/respondents'}><button>Start Recording Data!</button></Link> 
                {['meofficer', 'admin', 'manager'].includes(user.role) && <Link to={'/batch-record'}><button>Upload a file</button></Link> }
                {['meofficer', 'admin', 'manager'].includes(user.role) && <Link to={'/projects'}><button>See My Projects</button></Link> }
            </div>
            </div>
        </div>
    )
}

export default Home
