# End to End/Integration Test Structure

End to end/integration tests are run via playwright. Uses a local test db (*bonaso_test_db*). 

Run 
```bash
python manage.py runserver --settings=bonaso_data_server.settings_test
``` 
for tests to work. 

On setup (run before each test) the database is wiped and a new admin superuser is created. 

---
## Action Tests

The following tests are independent helpers that can be run in any tests. Meant to simultaneously test the basic function of a single action (i.e., fill out a form) and create context information in a realistic setting. Housed in independent helper functions

| Function/Test | Params | Checks |
| --------------|--------|--------|
|createRespondent|isAnon, id, firstName, lastName|Creation and anon logic|
|createIndicator|code, name, type, numeric, repeat, subcats, prereq, matchSubcats|Creation and form logic for subcats, prereqs, and type|
|createOrg|name|Creation|
|createClient|name|Creation|
|createProject|name|Creation|
|createEvent|tasks(REQUIRED), name|Creation|
|createSocialPost|tasks(REQUIRED), name|Creation|
|createUser|username, role, org, clientOrg|Creation|

There are also some contextual action tests, that will require the test to init on a specific page, but can still be run procedurealy.

| Function/Test | Params | Notes |
| --------------|-----------------|-------|
|createProjectActivity|name|Must be on a project page|
|createProjectDeadline|name|Must be on a project page|
|createTask|indicator(REQUIRED)|Must be on a project-orgaization page|
|createTarget|task(REQUIRED), relatedToTask|Must be on a project-orgaization page|
|createCount|task(REQUIRED)|Must be on an event page|
Test Strategy: Test via inclusion in larger flows
---

## Flow Tests
Below are some mock flows that both serve as tests for flows but can also be used as building blocks for more complex tests. Project Flow and Interaction Flow will be housed in independent functions so they can be reused.
|Test |Purpose|Chain of Events|Description|Role|
|-----|-------|---------------|-----------|----|
|Project Flow|Basic project creation| run createClient > run createProject > run createProjectActivity > run createProjectDeadline > run createIndicator(subcat) > run createOrg > assign org to project > go to project-org page > run createTask > run createTarget|Tests basic flow of creating a project and assigning an org to it|Admin|
|Interaction Flow|Basic Interaction Creation| run Project Flow > run createIndicator(subcat-numeric, repeat=false) run createIndicator(subcat/prereq) > run createTask x2 > run createRespondent > add interactions for three tasks > confirm that task with prereq has limited subcats > confirm three interactions in previous interactions|Tests basic flow of creating a respondent and assigning interactions|Admin|
|Event Flow|Basic Event/Count Creation| run Project Flow > run createIndicator(type=event_no) > run createIndicator(prereq) > run createTask > run createEvent > run createCount > runCreateCount(for prereq) > check flag for prereq > edit count > check flag resolved|tests basic flow of creating an event and counts for the event|Admin|
|Social Post Flow|Basic Social Flow Count| run ProjectFlow > run createIndicator(type=social) > run createTask > runCreateSocialPost > edit post metrics| Tests basic flow for creating a post and editing the metrics of a post|Admin|
|Duplicate Respondent Creation|Test Duplicate Warnings|run createRespondent > run createRespondent (same id) > check link to respondent|Tests taht creating a respondent with the same ID throws an error with a link to that profile.|Admin|
|Duplicate Interaction Creation|Test Flag for Duplicate Interactions|run Interaction Flow > addInteractions for one indicator with allowRepeat and one without and confirm one flag is present|Checks that 30-day repeat flag works|Admin|
|Interaction Prereq|Test that prereq flags work| run Project Flow > createRespondent > create interaction for task that has prereq > confirm flag > create task for prereq task > confirm resolve|Tests that prereq flags are created/resolved correctly|Admin|
|User Creation| Test basic user creation | run createOrg > run createUser(org=org, role!=client) > run createClient > runCreateUser(client=client, role=client)| Confirm basic user creation flow and confirm that org/client org assignment flow works correctly|Admin|

---
## Deferred
The following apps/features could be more extensively tested in the future, but are either considered low risk or are partially tested elsewhere, diminishing the need for their immeidate testing. 
- Flags (and user generated flags in general)
    - Flag index
- Analysis (dashboard/pivot table/line list creation)
    - Test dashboard and chart creation (assume that data is correct via backend tests)
    - Test chart creation logic (based on indicators/legend/chart type selections)
    - Test line list creation and download
    - Test pivot table creation and download
- Messaging
    - Can send, read, and mark messages as complete
    - Confirm correct status icons appear for read/completed messages
    - Create global announcement
    - Flag creates alert visible at home page
- Batch Record (backend testing covers most of the logic here)
    - Test upload file and get correct messages
- Narrative report uploading
    - Test upload file
- Lower Perm test (permissions are mostly tested in the backend, so this would be icing on the top, would also require alt setup or create user and logout)
    - M&E/Manager
        - Test user creation flow (correct roles, correct orgs, cannot edit roles)
        - Test can see org/child org user's
        - Test appropriate projects are seen
        - Test can assign/create subgrantees and assign then tasks/targets
        - Test cannot assign tasks/targets to self
        - Test cannot create Indicators/projects
        - Test can create project activities/deadlines/announcements with correct perms
    - Client
        - Test user creation flow (client role for same client org)
        - Test can view projects
        - Test can view but not edit respondents/interactions
        - Test can view but not edit events/social posts
    - Data Collector
        - Test cannot view/create anything except for respondent/interactions

