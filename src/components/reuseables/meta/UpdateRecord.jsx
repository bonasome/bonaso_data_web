import prettyDates from "../../../../services/prettyDates";
import { useAuth } from "../../../contexts/UserAuth";

function renderRecord(action, actor, timestamp, currentUser) {
    /*
    Helper component that returns the correct text based on whether the value exists and the user's role.
    */

    //if user does not have perm, just show the org that edited
    const canSeeName = currentUser.role === 'admin' || currentUser.organization_id === actor.organization.id;
    return (
        <p style={{ fontSize: 14}}>
            <i>
                {action} by{" "}
                {canSeeName
                    ? `${actor.display_name} (${actor.organization.name})`
                    : actor.organization.name}{" "}
                at {prettyDates(timestamp, true)}
            </i>
        </p>
    );
}

export default function UpdateRecord({ created_by, created_at, updated_by, updated_at }) {
    /*
    Simple component that takes created_by/at and updated_by/at values and returns them as a small 
    box.
    */
    const { user } = useAuth();
    if(!created_by) return <></>
    return (
        <div>
            {renderRecord("Created", created_by, created_at, user)}
            {updated_by && renderRecord("Updated", updated_by, updated_at, user)}
        </div>
    );
}