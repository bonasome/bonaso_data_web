const META_KEYS = new Set(['id', 'value', 'created_at', 'created_by', 'updated_at', 'updated_by', 'flags']);

//gets list of dimension keys (sex)
export function getDynamicKeys(count) {
    const keys = new Set();
    Object.keys(count).forEach(k => {
        if (!META_KEYS.has(k) && count[k]) {
            keys.add(k);
        }
    });
    return Array.from(keys);
}

//get dynamic list of all dimension "values" (male, female)
export function collectUniqueValues(counts, keys) {
    const uniques = {};
    keys.forEach(k => (uniques[k] = new Set()));
    counts.forEach(item => {
        keys.forEach(k => {
            uniques[k].add(normalizeVal(item[k]));
        });
    });
    // convert to array
    Object.keys(uniques).forEach(k => {
        uniques[k] = Array.from(uniques[k]);
    });
    return uniques;
}

//sort by length of items
export function sortKeysByCardinality(uniqueMap) {
    return Object.keys(uniqueMap).sort((a, b) => (uniqueMap[b].length - uniqueMap[a].length));
}

// Build all combinations of arrays of arrays
export function cartesian(arrays) {
    if (!arrays.length) return [[]];
    return arrays.reduce((acc, cur) => {
    const res = [];
    acc.forEach(a => cur.forEach(c => res.push([...a, c])));
    return res;
    }, [[]]);
}
export function normalizeVal(v) {
    // If object with `name`, use name (common for `option`). Otherwise string/number.
    if (v == null) return '';
    if (typeof v === 'object') {
        if ('name' in v) return String(v.name ?? '');
        return JSON.stringify(v);
    }
    return String(v);
}
export function buildColHeaderTree(colDims, uniquesByKey) {
    if (!colDims.length) return { headerRows: [], colKeys: [''] };
    const lists = colDims.map(k => uniquesByKey[k]);
    const combos = cartesian(lists);
    const colKeys = combos.map(c => c.join('||'));

    // headerRows: for each dimension level, an array of { label, colSpan }
    const headerRows = colDims.map((dim, level) => {
        const row = [];
        let i = 0;
        while (i < colKeys.length) {
            const parts = colKeys[i].split('||');
            const label = parts[level];
            // count how many adjacent keys have same label at this level
            let span = 1;
            let j = i + 1;
            while (j < colKeys.length && colKeys[j].split('||')[level] === label) {
                span++;
                j++;
            }
            row.push({ label, span, key: `${dim}:${label}:${i}` });
            i = j;
        }
        return row;
    });


    return { headerRows, colKeys };
}
// Build row tree (array of row objects) -- each row has labelParts (array) and rowKey
export function buildRowTree(rowDims, uniquesByKey) {
    if (!rowDims.length) return [{ labelParts: [''], rowKey: '' }];
    const lists = rowDims.map(k => uniquesByKey[k]);
    const combos = cartesian(lists);
    return combos.map(combo => ({ labelParts: combo, rowKey: combo.join('||') }));
}


// Build cells mapping: { [rowKey]: { [colKey]: sumValue } }
export function buildCells(counts, rowDims, colDims) {
    const cells = {};
    counts.forEach(item => {
        const rowParts = rowDims.map(k => normalizeVal(item[k]));
        const colParts = colDims.map(k => normalizeVal(item[k]));
        const rowKey = rowParts.join('||');
        const colKey = colParts.join('||');
        const v = Number(item.value ?? 0) || 0;
        if (!cells[rowKey]) cells[rowKey] = {};
        if (!cells[rowKey][colKey]) cells[rowKey][colKey] = {id: item?.id, value: 0};
        cells[rowKey][colKey].value += v;
    });
    return cells;
}


export function buildAutoMatrix(counts) {
    // options: { maxRowDims, maxColDims }
    const keys = getDynamicKeys(counts[0]);
    const uniques = collectUniqueValues(counts, keys);


    // sort dimensions by cardinality (desc)
    const sorted = sortKeysByCardinality(uniques);

    // default split heuristic: give more unique dims to rows
    const maxDims = sorted.length;
    const half = Math.ceil(maxDims / 2);


    const rowDims = sorted.slice(0, half);
    const colDims = sorted.slice(half);


    const rowTree = buildRowTree(rowDims, uniques);
    const { headerRows, colKeys } = buildColHeaderTree(colDims, uniques);
    const cells = buildCells(counts, rowDims, colDims);


    return {
        dims: { all: sorted, rowDims, colDims },
        uniques,
        rowTree,
        headerRows,
        colKeys,
        cells,
    };
}