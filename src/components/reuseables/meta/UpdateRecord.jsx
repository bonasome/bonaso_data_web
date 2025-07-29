import prettyDates from "../../../../services/prettyDates";
import { useAuth } from "../../../contexts/UserAuth";

function renderRecord(action, actor, timestamp, currentUser) {
    const canSeeName = currentUser.role === 'admin' || currentUser.organization_id === actor.organization.id;
    return (
        <p>
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
    const { user } = useAuth();
    if(!created_by) return <></>
    return (
        <div>
            {renderRecord("Created", created_by, created_at, user)}
            {updated_by && renderRecord("Updated", updated_by, updated_at, user)}
        </div>
    );
}