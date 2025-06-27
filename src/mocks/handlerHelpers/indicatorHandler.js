export const indicatorMeta = {'statuses': ['Active', 'Planned', 'Deprecated']}
export const getIndicatorList = [
    {
        "id": 1,
        "code": "HIV-TEST",
        "name": "HIV Testing",
    },
    {
        "id": 2,
        "code": "HIV-TP",
        "name": "HIV Tested Positive",
    },
    {
        "id": 3,
        "code": "HIV-MSG",
        "name": "HIV Messaging",
    },
    {
        "id": 4,
        "code": "HIV-CON",
        "name": "Condoms",
    },
]

export const getIndicatorDetailTypical = {
    "id": 1,
    "name": "HIV Testing",
    "code": "HIV-TEST",
    "prerequisite":  null,
    "description": "Proportion of individuals who received an HIV test.",
    "subcategories": [],
    "require_numeric": false,
    "status": "Active"
}

export const getIndicatorDetailPrereq = {
    "id": 2,
    "name": "HIV Tested Positive",
    "code": "HIV-TP",
    "prerequisite":  {
        "id": 1,
        "name": "HIV Testing",
        "code": "HIV-TEST",
    },
    "description": "Individuals tested positive for HIV.",
    "subcategories": [],
    "require_numeric": false,
    "status": "Active",
}

export const getIndicatorDetailSubcats = {
    "id": 3,
    "name": "HIV Messaging",
    "code": "HIV-MSG",
    "prerequisite":  null,
    "description": "Individuals reached with HIV messages.",
    "subcategories": [
        { "id": 101, "name": "CCC" },
        { "id": 102, "name": "ART" },
        { "id": 103, "name": "Testing" }
    ],
    "require_numeric": false,
    "status": "Active"
}

export const getIndicatorDetailNumeric = {
    "id": 4,
    "name": "Condoms",
    "code": "HIV-CON",
    "prerequisite":  null,
    "description": "Number of condoms distributed to an individual.",
    "subcategories": [],
    "require_numeric": true,
    "status": "Active"
}

export const postIndicator = {
    "name": "HIV Testing Rate",
    "code": "TEST-RATE",
    "prerequisite_id": 5,
    "description": "Proportion of individuals who received an HIV test.",
    "subcategory_names": [],
    "require_numeric": false,
    "status": "Active"
}
