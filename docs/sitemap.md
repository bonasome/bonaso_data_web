# BONASO Data Portal Website Sitemap
The following is a basic overview of the frontend site, grouped into "apps" of related pages (as displayed in the Navbar/Menu).

Navigation is primarily handled in [src/routes/Routes.jsx](/src/routes/Routes.jsx), where each app is grouped into route clusters.

**Note**: Relies on Components includes specialized components for that page. For globally reuseable components, see [components.md](/docs/components.md).

---

## Contents
- [Auth](#auth)
    - [Login](#login)
    - [Logout](#logout)
- [Home](#home)
- [Team](#team)
- [Messages](#messages)
- [Record](#record)
    - [Respondents](#respondents)
    - [BatchRecord](#batch-record)
    - [Events](#events)
    - [Social](#social)
- [Projects](#projects)
    - [Projects](#projects-1)
        - [Activities](#project-activities)
        - [Deadlines](#project-deadlines)
        - [ProjectOrganizations](#project-organization)
    - [Indicators](#indicators)
    - [Organizations](#organizations)
    - [Clients](#clients)
- [Analyze](#analyze)
    - [Dashboards](#dashboards)
    - [PivotTables](#pivot-tables)
    - [LineLists](#line-lists)
    - [Flags](#flags)
- [Tutorial](#tutorial)

---

## Auth
**Description**: The Auth app is for managing user authentication only. 

### Login
**Description**: The login page is the default page whenever the user is not logged it. It only contains a basic form that accepts username as password and passes it to the backend for processing. Upon logging in, the user is automatically redirected to the home page. 

**Main Component**: [Login](/src/components/auth/Login.jsx)

### Logout
**Description**: The logout page is only briefly displayed while the backend is processing the logout request, before the user is redirected to the login page.

**Main Component**: [Logout](/src/components/auth/Logout.jsx)

---

## Home
**Description**: The home page is the default landing page that contains items favorited for easy access and displays important updates for review on login. 

**Main Component**: [Home](/src/components/home/Home.jsx)
- **Relies on Components**: 
    - [PopUp](/src/components/home/Home.jsx): Displays a brief warning popup alerting the user to the sensitive information stored on the portal.
    - [Favorites](/src/components/home/Favorites.jsx): Box for displaying favorited content for easy access.
    - [UpdateBox](/src/components/home/UpdateBox.jsx): Box for displaying messages, announcements, and alerts.
        - **Relies on Components**:
            - [AnnouncementsIndex](/src/components/messages/announcements/AnnouncementsIndex.jsx): For displaying announcements.
            - [UnopenedMsg](/src/components/messages/UnopenedMsg.jsx): Displays a card with a link to view messages in more detail. 

---

## Team
**Description**: The Team app is a set of pages related to viewing, creating, and editing users. 

**Index Component**: [UsersIndex](/src/components/users/UsersIndex.jsx)

**Detail Component**: [Profile](/src/components/users/Profile.jsx)
- **Relies on Components**:
    - [Activity](/src/components/users/Activity.jsx): For displaying user activity.
    
**Create/Edit Component**: [UserForm](/src/components/users/UserForm.jsx)

**Permissions**: The team index is only visible to Managers/M&E Officers and admins (other users can only see their own profile page). Clients, M&E Officers/Managers, and admins can create users. 

--- 

## Messages
**Description**: The messages page is for writing and reading messages sent between two or more users. 

**Main Component**: [Messages](/src/components/messages/Messages.jsx)

- **Relies on Components**:
    - [MessageCard](/src/components/messages/MessageCard.jsx): Displays details about a message, including replies.
    - [UnopenedMessage](/src/components/messages/UnopenedMessage.jsx): A small card for use in sidebars that can be clicked to display a message in more detail.
    - [ComposeMessage](/src/components/messages/ComposeMessage.jsx): A component for writing/editing a message.

**Permissions**: Messages are private between users in a thread. By default users can only message users in their organization network or admins.

**Note**: Users can use the messages app to write to all admins for assistance or reporting bugs. 

---

## Record
**Description**: The record section includes pages whose primary purpose is to record data directly related to achieving project goals

### Respondents
**Description**: The respondents app is related to recording and managing data related to people (or respondents). This includes managing respondent profiles (demogrpahic information) and interactions (related to indicators via tasks).

**Index Component**: [RespondentsIndex](/src/components/respondents/RespondentsIndex.jsx)

**Detail Component**: [RespondentDetail](/src/components/respondents/RespondentDetail.jsx)
- **Relies on Components**:
    - [HIVStatus](/src/components/respondents/respondentDetail/HIVStatus.jsx): For displaying/editing a users HIV Status.
    - [Pregnancies](/src/components/respondents/respondentDetail/Pregnancies.jsx): For displaying/editing a users pregnancy history.
    - [Tasks](/src/components/tasks/Tasks.jsx): For displaying a users tasks on the sidebar.
    - [AddInteractions](/src/components/respondents/interactions/AddInteractions.jsx): For creating interactions from the tasks on the sidebar.
    - [Interactions](/src/components/respondents/interactions/Interactions.jsx): For viewing/editing past interactions.

**Create/Edit Component**: [RespondentForm](/src/components/respondents/RespondentForm.jsx)
- **Relies on Components**
    - - [PrivacyModal](/src/components/respondents/RespondentForm.jsx): Dispalys a popup about data privacy when creating a new respondent.

**Note**: For logistical and privacy reasons, HIV status and pregnancy information is edited in the detail page, not the create/edit form. 

### Batch Record
**Description**: Allows a user to select a project/organization to get a template they can use to collect data via Excel and then upload that template into the system.

**Main Component**: [BatchRecord](/src/components/batchRecord/BatchRecord.jsx)
- **Relies on Component**:
    - [ConflictManagerModal](/src/components/batchRecord/ConflictManagerModal.jsx): Displays a modal if an uploaded respondent already exists that allows a user to compare the DB information against their upload and decide which one to keep. 

**Permission**: Only M&E Officers/Managers and admins can access this tool.

### Events
**Description**: The events app is related to managing events that directly relate to project goals (not planning or monitoring meetings). It also serves as a place where users can enter aggregated information about indicators.

**Index Component**: [EventsIndex](/src/components/events/EventsIndex.jsx)

**Detail Component**: [EventDetail](/src/components/events/EventDetail.jsx)
- **Relies on Components**:
    - [Counts](/src/components/events/Counts.jsx): For creating and viewing demographic count tables related to events (displayed in a list with collapsable tables).

**Create/Edit Component**: [EventsForm](/src/components/events/EventForm.jsx)

**Permissions**: Available to admins, Clients, and M&E Officers/Managers (though clients cannot create/edit). By default editing is limited to M&E Officers/Managers from the hosting organization, with the only exception being that M&E Officers/Managers from participating child organizations/subgrantees can create/edit counts for their tasks in the event. 

### Social
**Description**: The social app is related to managing information about social media posts that contribute towards project goals.

**Index Component**: [SocialPostIndex](/src/components/social/SocialPostsIndex.jsx)

**Detail Component**: [SocialPostDetail](/src/components/social/SocialPostDetail.jsx)

**Create/Edit Component**: [SocialPostForm](/src/components/social/SocialPostForm.jsx)

**Note**: For ease of access, post metrics (likes, comments, etc) are edited on the detail page, not the create/edit component. 

**Permissions**: Available to admins, Clients, and M&E Officers/Managers (though clients cannot create/edit).

---

## Projects
**Description**: The Projects app is for managing organizing information about projects, organizations, and indicators that allow for easier data collection/analysis. 

**Permissions**: This entire network of apps is only visible to Admins, M&E Officers/Managers, and Clients. Clients have no edit abilities. Indicators are strictly for admins.

### Projects
**Description**: The projects app is for viewing and managing information related to projects. It contains built in sections for managing announcements, [project-activities](#project-activities), [project-deadlines](#project-deadlines), and has a list of organizations involved with the project that link to another detail page ([see below](#project-organization)).

**Index Component**: [ProjectsIndex](/src/components/projects/ProjectsIndex.jsx)

**Detail Component**: [ProjectDetail](/src/components/projects/ProjectDetail.jsx)
- **Relies on Components**:
    - [AnnouncementsIndex](/src/components/messages/announcements/AnnouncementsIndex.jsx): For displaying a fitlered list of announcements scoped to the project in question.
    - [ProjectActivityFAGantt](/src/components/projects/activities/ProjectActivityFAGanttChart): Creates the gantt chart with activities/deadlines at the top of the detail page.
    - [ProjectActivityIndex](/src/components/projects/activities/ProjectActivityIndex.jsx): See [below](#project-activities)
    - [ProjectDeadlineIndex](/src/components/projects/deadlines/ProjectDeadlineIndex.jsx): See [below](#project-deadlines)
    - [ProjectOrganization](/src/components/projects/ProjectOrganization.jsx): See [below](#project-organization)
    

**Create/Edit Component**: [ProjectForm](/src/components/projects/ProjectForm.jsx)

**Permissions**: Only admins can create/edit projects. Other M&E Officers/Managers can view information about their active projects. 

#### Project Activities
**Description**: Project Activities is a subsection of Project Detail that displays an index list of cards that contain details about each activity related to the project. Creating and editing links to a seperate page.

**Index Component**: [ProjectActivityIndex](/src/components/projects/activities/ProjectActivityIndex.jsx)

**Detail Component**: [ProjectActivityCard](/src/components/projects/activities/ProjectActivityCard.jsx)

**Create/Edit Component**: [ProjectActivityForm](/src/components/projects/activities/ProjectActivityForm.jsx)

**Permissions**: M&E Officers/Managers can create/edit activities for their organization or their child org. Admin can create for anyone/for everyone.

#### Project Deadlines
**Description**: Project Deadlines is a subsection of Project Detail that displays an index list of cards that contain details about each deadline related to the project. Creating and editing links to a seperate page.

**Index Component**: [ProjectDeadlineIndex](/src/components/projects/deadlines/ProjectDeadlineIndex.jsx)

**Detail Component**: [ProjectDeadlineCard](/src/components/projects/deadlines/ProjectDeadlineCard.jsx)

**Create/Edit Component**: [ProjectDeadlineForm](/src/components/projects/deadlines/ProjectDeadlineForm.jsx)

**Permissions**: M&E Officers/Managers can create/edit deadlines for their organization or their child org. Admin can create for anyone/for everyone.

#### Project Organization
**Description**: The Project Organization page is a link that displays and allow users to edit information unique to a specific project and organization (targets, tasks, subgrantees/child organizations, and narrative reports/supporting docuemnts). It is accessible either via a link in the organizations section of a project detail page or via the projects section of an organization's detail page. 

**Main Component**: [ProjectOrganization](/src/components/projects/ProjectOrganization.jsx)
- **Relies on Components**:
    - [Tasks](/src/components/tasks/Tasks.jsx): For displaying a list of tasks filtered to the project and organization.
    - [Targets](/src/components/projects/targets/Targets.jsx): For displaying a list of targets (has a related seperate component that displays a create/edit [modal](/src/components/projects/targets/EditTargetModal.jsx)).
    - [NarrativeReportDownload](/src/components/narrativeReports/NarrativeReportDownload.jsx): Displays a list of related supporting documents that can be downloaded. Also contains a link to a seperate page for [uploading](/src/components/narrativeReports/NarrativeReportUpload.jsx) narrative reports that accepts the project and organization as URL params.

**Permissions**: M&E Officers/Managers can assign tasks and targets for their child organization, but not for their own organization. Admins can assign tasks/targets for anyone. If an organization does not have a prent organization, M&E Officers/Managers and admins can assign subgrantees to them. If they are already a subgrantee/child organization of another org in this project, this section will be hidden entirely. 

### Indicators
**Description**: The Indicators app is for managing content related to indicators, which track information about project goals.

**Index Component**: [IndicatorsIndex](/src/components/indicators/IndicatorsIndex.jsx)

**Detail Component**: [IndicatorDetail](/src/components/indicators/IndicatorDetail.jsx)

**Create/Edit Component**: [IndicatorForm](/src/components/indicators/IndicatorDetail.jsx)

**Permissions**: The indicator page network should only be visible to admins, since only they have permission to create/edit indicators. Other users interact with indicators via tasks assigned to their specific organization.

### Organizations
**Description**: The Organizations app is for managing content related to organizations.

**Index Component**: [OrganizationsIndex](/src/components/organizations/OrganizationsIndex.jsx)

**Detail Component**: [OrganizationDetail](/src/components/organizations/OrganizationDetail.jsx)

**Create/Edit Component**: [OrganizationForm](/src/components/organizations/OrganizationDetail.jsx)

**Permissions**: M&E Officers/Managers can view/edit content for their organization or organizations that are serving as their child/subgrantee for a project. Admins can view/edit all organization content. M&E Officers/Managers and admins can create new organizations. 

### Clients
**Description**: The Clients app manages content related to clients. Clients are only used to assign to projects and to manage Client user's permissions.

**Index Component**: [ClientsIndex](/src/components/projects/clients/ClientsIndex.jsx)

**Detail Component**: [ClientDetail](/src/components/projects/clients/ClientsDetail.jsx)

**Create/Edit Component**: [CreateClientModal](/src/components/projects/clients/CreateClientModal.jsx)

**Permissions**: Only admins can create/view client information.

---

## Analyze
**Description**: The Analyze section is for viewing/analyzing data collected using the portal. 

**Permissions**: M&E Officers/Managers, Clients, and admins can access this section. M&E Officers/Managers only see data they or their childo orgs/subgrantees collect. Clients only see data related to projects they are a client on. Note that all settings for dashboards/charts/tables/lists is scoped per user. 

### Dashboards
**Description**: A dashboard is a collection of charts that can be scoped to a project/organization. Each chart within a dashboard is scoped to one or more indicators and can be broken down by various demographic or project information. The main component has a side panel listing all of a users dashboards. Clicking on one will reveal the dashboard's charts in the main panel. 

**Main Component**: [Dashboards](/src/components/analytics/dashboards/Dashboards.jsx)
- **Relies on Components**:
    - [CreateDashboardModal](/src/components/analytics/dashboards/CreateDashboardModal.jsx): A small modal for creating/editing dashboard settings. 
    - [Dashboard](/src/componenets/analytics/dashboards/Dashboards.jsx): Displays an individual dashboard.
        - **Relies on Components**:
            - [ChartSettingsModal](/src/components/analytics/dashboards/ChartSettingsModal.jsx): Creates or edits settings for a specific chart within a dashboard.
            - [IndicatorChart](/src/components/analytics/dashboards/IndicatorChart.jsx): Displays an individual chart for a dashboard.
                - **Relies on Components**:
                    - [DataTable](/src/components/analytics/dashboards/DataTable.jsx): For displaying a data table beneath the chart.
                    - [ChartFilters](/src/components/analytics/dashboards/ChartFilters.jsx): For managing chart-level filters.

**Notes**: Chart data is organized using the [splitToChart](/src/components/analytics/dashboards/splitToChart.js) function.

### Pivot Tables
**Description**: Pivot tables display pivot tables for a spcific indicator. They can split by a variety of demographic/indicator level information and filtered by project/organization/date. All of a users pivot tables are displayed on the sidebar, clicking on one will reveal it in the main panel. Users can download pivot tables as a CSV file.

**Main Component**: [PivotTables](/src/components/analytics/pivotTables/PivotTables.jsx)
- **Relies on Components**:
    - [PivotTable](/src/components/analytics/pivotTables/PivotTable.jsx): Displays an individual pivot table.
    - [PivotTableSettings](/src/components/analytics/pivotTables/PivotTableSettings.jsx): Displays a modal for creating or editing a pivot table's settings.

### Line Lists
**Description**: Line Lists display all data from interactions in a list format with respondent-level and interaction-level information. They can be filtered by project/organization/indicator/date. All of a users line lists are displayed on the sidebar, clicking on one will reveal it in the main panel. Users can download a line list as a CSV file.

**Main Component**: [LineLists](/src/components/analytics/lineLists/LineLists.jsx)
- **Relies on Components**:
    - [LineList](/src/components/analytics/lineLists/LineList.jsx): Displays an individual line list.
    - [LinelistSettings](/src/components/analytics/lineLists/LineListSettings.jsx): Displays a modal for creating or editing a line table's settings.

### Flags
**Description**: This component is a centralized source where a user can see all flags pertinent to them. They can also view these on individual detail pages, but this is a helpful consolidated source of the information. 

**Main Component**: [FunWithFlags](/src/components/flags/FunWithFlags.jsx)
- **Relies on Component** 
    - [Metadata](/src/components/flags/metdata/Metadata.jsx): Contains the first highlight summary section on the page.
        - **Relies on Component**: 
            - [FlagCharts](/src/components/flags/metadata/FlagCharts.jsx): Manages the charts displayed in metadata.
---

## Tutorial
**Main Component**:  Tutorial ([src/components/tutorial/Tutorial.jsx])

**Description**: Overviews a basic sitemap with features and definition of terms. 

---

## Permissions Table

| Role | Auth | Team | Messages | Record | Projects | Analyze | Tutorial |
|------|------|------|----------|--------|----------|---------|----------|
| Admin | Full | Full | Full | Full | Full | Full | View
| Client | Partial | Profile only | Within Org/Admin | View | View Client Org | Scope to Project | View
| M&E Officer | Partial | Manage Org | Within Org/Admin | Full | Manage Org | Scope to Org | View
| Data Collector | Login only | Profile only | Within Org/Admin | Respondents Only | None | None | View