import { useAuth } from "../../contexts/UserAuth"
import styles from './tutorial.module.css'
import { Link } from 'react-router-dom'

export default function Tutorial(){
    /*
    Basic tutorial component. Shows/hides some sections depending on the user's role. 
    */
    const { user } = useAuth();
    return(
        <div className={styles.container}>
            <div className={styles.section}>
                <h2>Welcome!</h2>
                <p>
                    Welcome to the BONASO Data Portal. Thank you for joining us in the fight to 
                    improve the health and welfare of everyone in Botswana!

                    This portal is intended to help you and us collect, store, and track vital
                    data efficiently, giving us more time to focus on your important work. On 
                    this page, you can find a short description of what the website does and how
                    to make the most out of it.
                </p>
                <Link to={`/messages`}><button>Reach out!</button></Link>
                <p>
                    If you're ever confused or need some help, do not help to contact a site 
                    administrator (or admin). We are always happy to help answer any questions you have.
                    You can click the button above, or email us at <strong>info@bonaso.org</strong>.
                </p>
                <p>
                    Also, as you use the site, we would greatly appreciate it if you could tell us 
                    if anything does not work or if there are any features you would like to see included.
                    This site is still growing, and your help would be greatly appreciated to making this 
                    tool as good as it can be!
                </p>
            </div>
            <div className={styles.section}>
                <h2>Some Terms to Begin</h2>
                <p>
                    As you move through this website, you'll encounter some terms frequently. 
                    <ul>
                        <li>Organization: A CSO working on a project. It could be a coordinator or a subgrantee.</li>
                        <li>Parent Organization: A coordinating CSO that has subgrantees. They have permission to assign tasks to subgrantees and edit information about them.</li>
                        <li>Child Organization: Or "Subgrantee" is an organization that is underneath a parent organization. They can be assigned tasks by their parent organization.</li>
                        <li>Project: This is a project that your organization is working on. You may see many projects of you may see just one.</li>
                        <li>Indicator: An indicator is a metric that a project is tracking. Indicators can be reused in several projects.</li>
                        <li>Task: A task is when an indicator is assigned to an organization within a project.</li>
                        <li>Respondent: A respondent is a person that you are collecting data from.</li>
                        <li>Interaction: An interaction is when you "interact" with a respondent. This could be testing them for HIV or delivering NCD messages. Each interaction is tied to a task you were assigned.</li>
                        <li>Event: An event is any type of activity that contributes towards the project goals. This could include counselling sessions, walkathons, activations, or anything.</li>
                    </ul>
                </p>
            </div>
            {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <div className={styles.section}>
                    <h2>Projects</h2>
                        <p>
                            To begin, check out your projects. You can get their by clicking the 
                            <Link to={'/projects'}> "Projects"</Link> link at the top of the screen (click the three bars if 
                            needed). This is the place where you will see all important
                            information about the project/tasks you have been assigned. 
                        </p>
                        <p>
                            When you click on a project, you can explore the dropdown tabs. You can view/create 
                            an activity to help you keep track of important meetings, set a deadline to keep
                            track of important dates, and view organizations.
                        </p>
                        <p>
                            For more information, click on the "Organizations" tab and find your organization.
                            On this page, you will see more information about the tasks assigned to your 
                            organization and your targets. You can also view and add subgrantees here.
                        </p>
                </div>
            }
            <div className={styles.section}>
                <h2>Respondents</h2>
                    <p>
                        Respondents (or clients) are the people that we are collecting data from. 
                        They are at the core of this website. To view them, click on the <Link to={'/respondents'}> 
                        Respondents</Link>tab above. Here, you will be taken to a list of all respondents. 
                        You can search by name/village to find one or create a new one. 
                    </p>
                    <p>
                        Once you have created or found a respondent, click on their name to get 
                        taken to a page that contains information about them. You 
                        will also see a list of all your tasks. When in the field, while interacting 
                        with respondents, simply drag and drop a task into the add interactions box
                        (or click the "Add Task" button) 
                        to record it. Upon adding an interaction, you may be prompted to enter more
                        information about that interaction (such as a number or select some subcategories).
                    </p>
                    <p>
                        Once you click save, all these interactions will be saved into our database, and 
                        will contribute towards your organizations targets.
                    </p>
                    <p>
                        You can also view any past interactions this respondent has had by scrolling down
                        and checking out the "Interactions" panel.
                    </p>
                    {['meofficer', 'manager', 'admin'].includes(user.role) && <p>
                        You also have the option to upload interactions via Excel files. Hover over the respondents
                        tab (or click the three bars) and look for the "Batch Record" link. This will take you 
                        to a page that allows you to generate templates and upload completed templates. 
                    </p>}
            </div>
            {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <div className={styles.section}>
                    <h2>Projects</h2>
                        <p>
                            If you hover over the "Team" link at the top (or click the three bars)
                            you will see an option to "Add a New User". Here you can enter the requested
                            information and apply for a new member to be able to use the site. Once an 
                            admin has reviewed your request, they will allow them access into the site.
                        </p>
                </div>
            }
            {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <div className={styles.section}>
                    <h2>Events</h2>
                        <p>
                            If you hover over the  "Record" tab at the top (or click the three bars)
                            you will see an option for <Link to={'/events'}></Link>. Here you can 
                            record information about your events by linking the event to one of your tasks.
                            You can also add counts (for example, if you trained a certain number of people)
                            which can be broken down by demographic information. You can also assign organizations
                            as participants, which both allows them to edit counts for their tasks in that event
                            and will count them towards any "Number of Organization" task (i.e., number of subgrantees
                            trained).
                        </p>
                </div>
            }
            {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <div className={styles.section}>
                    <h2>Posts</h2>
                        <p>
                            Hovering over the "Record" tab will also give you access to <Link to='/posts'> Posts</Link>,
                            which allows you to record data about social media posts. Each post is linked to a task and a 
                            platform. After creating a post, you can view its detail page to edit metrics (likes, comments, views)
                            which will contribute towards task targets.
                        </p>
                </div>
            }
            {['meofficer', 'manager', 'admin'].includes(user.role) && 
                <div className={styles.section}>
                    <h2>Team</h2>
                        <p>
                            If you hover over the <Link to={'/profiles'}> "Team"</Link> link at the top (or click the three bars)
                            you will see an option to "Add a New User". Here you can enter the requested
                            information and apply for a new member to be able to use the site. Once an 
                            admin has reviewed your request, they will allow them access into the site.
                        </p>
                </div>
            }
            
        </div>
    )
}