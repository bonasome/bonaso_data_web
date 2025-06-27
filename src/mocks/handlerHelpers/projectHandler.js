import { getIndicatorDetailTypical, getIndicatorDetailPrereq, getIndicatorDetailSubcats, getIndicatorDetailNumeric } from "./indicatorHandler"
import { getOrgsList } from './organizationsHandler'


export const getTaskTypical = {
    "id": 1,
    "indicator": getIndicatorDetailTypical,
    "organization": getOrgsList[0],
    "project": {
        "id": 1,
        "name": "Alpha Project",
        "client": {
            "id": 1,
            "name": "NAHPA"
        },
        "start": "2025-01-01",
        "end": "2025-12-31",
        "status": "active"
    },
    "targets": null
}

export const getTaskPrereq = {
    "id": 2,
    "indicator": getIndicatorDetailPrereq,
    "organization": getOrgsList[0],
    "project": {
        "id": 1,
        "name": "Alpha Project",
        "client": {
            "id": 1,
            "name": "NAHPA"
        },
        "start": "2025-01-01",
        "end": "2025-12-31",
        "status": "active"
    },
    "targets": null
}

export const getTaskSubcats = {
    "id": 3,
    "indicator": getIndicatorDetailSubcats,
    "organization": getOrgsList[0],
    "project": {
        "id": 1,
        "name": "Alpha Project",
        "client": {
            "id": 1,
            "name": "NAHPA"
        },
        "start": "2025-01-01",
        "end": "2025-12-31",
        "status": "active"
    },
    "targets": null
}
export const getTaskNumeric = {
    "id": 4,
    "indicator": getIndicatorDetailNumeric,
    "organization": getOrgsList[0],
    "project": {
        "id": 1,
        "name": "Alpha Project",
        "client": {
            "id": 1,
            "name": "NAHPA"
        },
        "start": "2025-01-01",
        "end": "2025-12-31",
        "status": "active"
    },
    "targets": [{'id': 1, 'start': '2025-01-01', 'end': '2025: 01-31', 'amount': 100}]
}


//project index
export const getProjectsList = [
    {
        "id": 1,
        "name": "Alpha Project",
        "client": {
            "id": 1,
            "name": "NAHPA"
        },
        "start": "2025-01-01",
        "end": "2025-12-31",
        "status": "active"
    },
    {
        "id": 2,
        "name": "Beta Project",
        "client": {
            "id": 2,
            "name": "MOH"
        },
        "start": "2025-01-01",
        "end": "2025-12-31",
        "status": "active"
    },
]
//project detail
export const getProjectDetail = {
    "indicators": [getIndicatorDetailNumeric, 
        getIndicatorDetailPrereq, 
        getIndicatorDetailTypical, 
        getIndicatorDetailSubcats
    ],
    "organizations": getOrgsList,
    "id": 1,
    "name": "Alpha Project",
    "client": {
        "id": 1,
        "name": "Global Health Initiative"
    },
    "start": "2025-01-01",
    "end": "2025-12-31",
    "status": "active",
    "description": "This is a project.",
    "tasks": [getTaskTypical, getTaskPrereq, getTaskSubcats, getTaskNumeric],
}

export const getTasksList = [
    getTaskTypical, getTaskPrereq, getTaskNumeric, getTaskSubcats
]
export const getProjectMeta = {
    statuses: ['active', 'completed', 'cancelled'],  // mock status choices
    clients: [
      { id: 1, name: 'NAHPA' },
      { id: 2, name: 'MOH' },
    ],
  }