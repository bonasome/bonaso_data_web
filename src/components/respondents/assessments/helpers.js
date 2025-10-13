export const checkLogic = (c, responseInfo, assessment, respondent) => {
    if(!c || !responseInfo ||!assessment ||!respondent) return false
    if(c.source_type == 'assessment'){

        const prereq = assessment.indicators.find(i => i.id == c.source_indicator);
        let reqVal = null
        if(['single', 'multi'].includes(prereq.type)) reqVal = c.condition_type ? c.condition_type : c.value_option;
        else if(['boolean'].includes(prereq.type)) reqVal = c.value_boolean;
        else reqVal = c.value_text;
        let prereqVal = responseInfo?.[c.source_indicator]?.value
        if ((prereq.type === 'multi') && ['any','none','all'].includes(c.condition_type)) {
            prereqVal = prereqVal || [];
            switch(reqVal) {
                case 'any':
                    return prereqVal.length > 0;
                case 'none':
                    return prereqVal.includes('none');
                case 'all':
                    return prereqVal.length === (prereq.options?.length || 0);
            }
        }
        if ((prereq.type === 'single') && ['any','none','all'].includes(c.condition_type)) {
            prereqVal = prereqVal || null;
            switch(reqVal) {
                case 'any':
                    return prereqVal;
                case 'none':
                    return prereqVal == 'none';
                case 'all':
                    return false; // impossible
            }
        }
        if(prereq.type=='multi'){
            if(c.operator == '=') return prereqVal?.includes(reqVal);
            if(c.operator == '!=') return !prereqVal?.includes(reqVal);
        }
        else{
            if(c.operator == '=') return prereqVal == reqVal;
            if(c.operator == '!=') return prereqVal != reqVal;
        }
        
        if(['>', '<'].includes(c.operator)){
            if(isNaN(prereqVal) || isNaN(reqVal)){
                console.warn('Cannot compare a non-integer.');
                return false
            }
            return c.operator == '>' ? reqVal > prereqVal : reqVal < prereqVal
        }
        else if(c.operator == 'contains'){
            return prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        else if(c.operator == '!contains'){
            return !prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        return false
    }
    else if(c.source_type == 'respondent'){
        const reqVal = c.value_text;
        const prereqVal = respondent?.[c.respondent_field];
        //these are all that's supported right now
        if(c.operator == '=') return prereqVal == reqVal;
        if(c.operator == '!=') return prereqVal != reqVal;
        return false;
    }
}


export const calcDefault = (assessment, existing=null) => {
    if(!assessment) return {}
    let map = {}
    
    assessment.indicators.forEach((ind) => {
        if(ind.type == 'multi'){
            const val =  (existing && ind.allow_none) ? (existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.response_option.id)).length > 0 ? 
                existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.response_option.id)) : ['none']) : 
                existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.response_option.id)) ?? [];
            map[ind.id] = { value: val }
        } 
        else if(ind.type == 'single'){
            const val = (ind.allow_none && existing) ? (existing?.responses?.find(r => r.indicator.id == ind.id)?.response_option ?? 'none'): 
                existing?.responses?.find(r => r.indicator.id == ind.id)?.response_option ?? null;
            map[ind.id] = { value: val }
        }
        else if(ind.type == 'boolean'){
            const val = existing?.responses.find(r => r.indicator.id == ind.id)?.response_boolean ?? false;
            map[ind.id] = { value: val }
        }
        else {
            const val = existing?.responses?.find(r => r.indicator.id == ind.id)?.response_value ?? '';
            map[ind.id] = { value: val }
        }
    });
    console.log(map)
    return map;
}