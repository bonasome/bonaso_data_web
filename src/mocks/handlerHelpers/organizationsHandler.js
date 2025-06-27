export const getOrgsList = [
    {
        "id": 1,
        "name": "Health Org Botswana",
        "parent_organization": null,
        "child_organizations": [{
            "id": 1,
            "name": "Health Org Botswana",
        }]
    },

    {
        "id": 2,
        "name": "JR Health Org BW",
        "parent_organization": {
            "id": 1,
            "name": "JR Health Org Botswana",
        }
    },
]

export const parentOrgDetail = {
    "id": 1,
    "name": "Health Org Botswana",
    "full_name": "Health Organization of Botswana",
    "parent_organization": null,
    "office_address": "Plot 1234, Main Mall, Gaborone",
    "office_phone": "+267 123 4567",
    "office_email": "info@healthbots.org",
    "executive_director": "Dr. Alice Molefi",
    "ed_phone": "+267 765 4321",
    "ed_email": "alice.molefi@healthbots.org",
    "child_organizations": [
        {
        "id": 2,
        "name": "JR Health Org BW"
        },
    ]
}

export const childOrgDetail = {
    "id": 2,
    "name": "JR Health Org BW",
    "parent_organization": {
        "id": 1,
        "name": "Health Org Botswana"
    }
}