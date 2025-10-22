export const checkLogic = (c, responseInfo, assessment, respondent) => {
    /*
    Function that evaluates a condition given an assessment/response data to determine if it meets
    criteria and therefore whether or not it should be visible:
    -c (object): logical condition it needs to pass
    - responseInfo (object): responses already given
    - assessment (object): what assessment this is a part of
    - respondent (object): what respondent this is for. 
    */
    if(!c || !responseInfo ||!assessment ||!respondent) return false
    //if its based on a response in the assessment
    if(c.source_type == 'assessment'){
        //this is the source indicator whose value will determine if this should be visible
        const prereq = assessment.indicators.find(i => i.id == c.source_indicator);
        let reqVal = null //value required for visibility
        if(['single', 'multi'].includes(prereq.type)) reqVal = c.condition_type ? c.condition_type : c.value_option; //could either be a conditon type or an option id
        else if(['boolean'].includes(prereq.type)) reqVal = c.value_boolean; //true/false
        else reqVal = c.value_text; //or a custom textual/numeric value

        let prereqVal = responseInfo?.[c.source_indicator]?.value //find the value entered for this indicator in this response
        
        if(prereqVal ==null || prereqVal == undefined) return false //if no prereqVal, always return false
        if([null, '', undefined].includes(prereqVal)) return false; //also check for includes for multiselects

        //check condition types first
        if ((prereq.type === 'multi') && ['any','none','all'].includes(c.condition_type)) {
            //multi is an array, so check includes/length
            prereqVal = prereqVal || [];
            switch(reqVal) {
                case 'any':
                    return prereqVal.length > 0 && !['none'].includes(prereqVal); //when none is selected/allowed
                case 'none':
                    return prereqVal.includes('none');
                case 'all':
                    return prereqVal.length === (prereq.options?.length || 0);
            }
        }
        if ((prereq.type === 'single') && ['any','none','all'].includes(c.condition_type)) {
            //single is a string/int, so check equality
            prereqVal = prereqVal || null;
            switch(reqVal) {
                case 'none':
                    return prereqVal == 'none';
                case 'any':
                    return prereqVal && prereqVal != 'none'; //when none is selected/allowed
                case 'all':
                    return false; // impossible
            }
        }
        //multi will check if includes/not includes
        if(prereq.type=='multi'){
            if(c.operator == '=') return prereqVal?.includes(reqVal);
            if(c.operator == '!=') return !prereqVal?.includes(reqVal);
        }
        //otherwise check equality
        else{
            if(c.operator == '=') return prereqVal == reqVal;
            if(c.operator == '!=') return prereqVal != reqVal;
        }
        //for ints, you can check greater/less than
        if(['>', '<'].includes(c.operator)){
            if(isNaN(prereqVal) || isNaN(reqVal)){
                console.warn('Cannot compare a non-integer.');
                return false
            }
            return c.operator == '>' ? parseFloat(prereqVal) > parseFloat(reqVal) : parseFloat(prereqVal) < parseFloat(reqVal)
        }
        //text cna check contains/not contains
        else if(c.operator == 'contains'){
            return prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        else if(c.operator == '!contains'){
            return !prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        return false
    }
    //for respondent, check the field
    else if(c.source_type == 'respondent'){
        const reqVal = c.value_text;
        //this one needs us to dig down a layer
        const prereqVal = c.respondent_field == 'hiv_status' ? (respondent?.hiv_status?.hiv_positive ? "true" : 'false') : 
            respondent?.[c.respondent_field];
        //these are all that's supported right now
        if(c.operator == '=') return prereqVal == reqVal;
        if(c.operator == '!=') return prereqVal != reqVal;
        return false;
    }
}


export const calcDefault = (assessment, existing = null) => {
    /*
    Calculates the default values, either initializing the indicator with the correct data type or 
    populating an existing value if editing. 
    - assessment (object): assessment to calculate
    - existing (object): existing values if editing a previous response
    */
    if (!assessment) return {};
    let map = {}; //object that maps values to keys (indicator id)

    assessment.indicators.forEach((ind) => {
        //find first match in existing (multi/multint may have more than one, but in that case we'll build an array from the different response options/values)
        const firstMatch = existing?.responses?.find(r => r.indicator.id == ind.id) ?? null;
        const rDate = firstMatch?.response_date ?? '';
        const rLocation = firstMatch?.response_location ?? '';

        // MULTI-SELECT (build array from existing options or empty array)
        if (ind.type === 'multi') {
            let val = existing
                ? existing.responses
                      .filter(r => r.indicator.id == ind.id)
                      .map(r => r.response_option?.id)
                : []; //build an array from all responses from this indicator
            if (ind.allow_none && existing && (!val || val.length === 0)) {
                //a none option isn't stored, but if something exists and this should be visible we'll assume none was selected
                val = ['none'];
            }
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
        else if(ind.type == 'multint'){
            let val = ind.options.map(o => ({ 
                option: o.id, 
                value: existing?.responses?.find(r => (r?.indicator?.id == ind.id && r?.response_option?.id == o?.id))?.response_value ?? ''
            })) //build an option/value pair from each existing response
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
        // SINGLE-SELECT
        else if (ind.type === 'single') {
            let val;
            if (existing) {
                if (ind.allow_none && existing) {
                    //a none option isn't stored, but if something exists and this should be visible we'll assume none was selected
                    val = 'none';
                } 
                else {
                    val = firstMatch?.response_option?.id ?? null;
                }
            } else {
                val = null;
            }
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }

        // BOOLEAN
        else if (ind.type === 'boolean') {
            const val = [true, false].includes(firstMatch?.response_boolean) ? firstMatch?.response_boolean : null;
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }

        // TEXT / NUMBER / OTHER
        else {
            const val = firstMatch?.response_value ?? '';
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
    });

    return map;
};