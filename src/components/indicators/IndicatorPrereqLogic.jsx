import { useState, useMemo, useEffect } from 'react';

import SimpleSelect from '../reuseables/inputs/SimpleSelect';
import ModelMultiSelect from '../reuseables/inputs/ModelMultiSelect';
import IndicatorsIndex from './IndicatorsIndex';

//helper function to manage some of the special logic for creating indicators so dynamic form does not get
//too complicated
export default function IndicatorPrereqLogic({ existing, callback }){
    //list of indicators selected
    const [selected, setSelected] = useState([]);

    //check list of eligible match subcats (has subcats)
    const [hasSubcats, setHasSubcats] = useState([]);
    const [matchTo, setMatchTo]  = useState();

    //base initial state to prevent infinite loops
    const [initial, setInitial] = useState([]);

    //helper to set initial vals
    useEffect(() => {
        setInitial(existing?.prereqs ?? []);
        setMatchTo(existing?.match ?? null);
    }, [existing])

    //callback/update match select on indicators change
    useEffect(() => {
        if(!selected || selected.length == 0) return;
        const subcats = selected?.filter((s) => (s.subcategories > 0));
        setHasSubcats(subcats.map((ind) => ({value: ind.id, label: ind.display_name})));
        callback(selected, matchTo)
    }, [selected]);

    //callback on switching match
    useEffect(() => {
        callback(selected, matchTo)
    }, [matchTo]);

    return(
        <div>
            <ModelMultiSelect title={'Select Prerequisites'}
                callback={(s) => setSelected(s)} IndexComponent={IndicatorsIndex}
                callbackText={'Select as Prerequisite'} existing={initial} 
            />
            {hasSubcats.length > 0 && <SimpleSelect name={'match_subcategories_to'} label={'Match Subcategories With'} 
                optionValues={hasSubcats.map((s) => (s.value))} optionLabels={hasSubcats.map((s) => (s.label))}
                callback={(val) => {setMatchTo(val); callback(selected, val)}} value={matchTo}
            />}
        </div>
    )
}