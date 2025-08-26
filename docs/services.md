# Bonaso Data Website: Services

The [services] folder provides utility functions and helpers that standardize common patterns across the frontend. They’re not tied to specific components, but many components depend on them.

This document is intended as a quick reference. For complex logic or specific use cases, see the linked component files.

## fetchWithAuth ([services/fetchWithAuth.js])
This is a helper function that expands on the native fetch by helping to manage token authentication. For more detail, see [docs/auth.md]

**Example Usage**
```javascript
const response = await fetchWithAuth("/api/manage/projects/");
const data = await response.json();
```

## authServices ([services/authServices.js])
This is a helper function that translates some of the features found in [src/contexts/UserAuth.jsx] into vanilla js so that fetchWithAuth can also use them. 

## cleanLabels ([services/cleanLabels.js])
Since our database often sends hard-to-read labels that include underscores or all lowercase words, this function tries to help make these more readable by splitting words, capitalizing, and spelling out some common abbreviations. It can be used instead of a full value/label map sometimes. 

**Example Usage**
```javascript
<div>
    <p>This is a {cleanLabel('example_of_clean_labels')}</p>
</div>
```
Returns : Example Of Clean Labels

## dateHelpers ([services/dateHelpers.js])
Contains a variety of functions that help with converting various date ranges in quarters/months. It is mostly specific to the target edit modal ([src/components/projects/targets/EditTargetModal.jsx]) since this tries to simplify date ranges by converting start/end dates into readable month/quarter labels, but could be used for other components as well. 

**Example Usage**: see [src/components/projects/targets/EditTargetModal.jsx]

## favorite ([services/favorite.js])
Contains helper API calls that take an object type/id and send it to the server to be favorited. Works for projects, events, and respondents, but could be expanded if edited in tandem with the backend.

**Example Usage**: see [src/components/projects/ProjectDetail.jsx]

## getColor ([services/getColor.js])
Most used for charts, takes an index position and returns a color based on the index (follows a theme up to a certain number, where it defaults to random colors).

**Example Usage**: see [src/components/analytics/dashboards/IndicatorChart.jsx]
Returns: hex code for a color based on the index

## modelMap ([services/modelMap.js])
Helps convert some of the generic foreign key objects (flags, favorites, profile activity records) and returns labels and url paths that a user can read/use.

**Example Usage**: see [src/components/home/Favorites.jsx]

## prettyDates ([services/prettyDates.js])
Converts ISO dates into slightly easier to read formats.

```javascript
<div>
    <p>This happened on {prettyDates('2000-11-11')}</p>
</div>
```
Returns: November 11, 2000

## useWindowWidth ([services/useWindowWidth.js])
Helper function that gets the window width to allow for dynamic resizing or changing of components based on the screen width. 

**Example Usage**:
```javascript
const width = useWindowWidth();

<div>
    {width > 768 ? <p>This is a computer!</p> : <p>This is a phone</p>}
</div>
```
Will return the computer paragraph if the users screen width is greater than 768 pixels and the phone paragraph is less than 768 pixels.