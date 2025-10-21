import modalStyles from '../../../styles/modals.module.css';
import theme from '../../../../theme/theme';

export default function AssessmentIndicatorsModal({ assessment, meta, onClose}){
    //helper function that converts db values to labels
    const getLabelFromValue = (field, value) => {
        if(!meta) return null
        const match = meta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    return(
        <div className={modalStyles.modal}>
            <h2>Indicators in {assessment?.name} Assessment</h2>
            <div>
                {assessment.indicators.sort((a, b) => (a.order - b.order)).map((ind) => (<div key={ind.id} style={{ borderBottom: '4px solid white'}}>
                    <p>{ind.order+1}. {ind.name} ({getLabelFromValue('type', ind.type)})</p>
                    {ind.description && ind.description != '' && <p>Description: <i>{ind.description}</i></p>}
                    {ind.options && ind.options.length > 0 && <div style={{ margin: '2vh'}}>
                        <strong>Options</strong>
                        <ul>
                            {ind.options.map((o) => (<li>{o.name}</li>))}
                            {ind.allow_none && <li>None of the above.</li>}
                        </ul>
                    </div>}
                    {ind.logic && ind.logic.conditions && ind.logic.conditions.length > 0 && <div style={{ backgroundColor: theme.colors.bonasoLightAccent, padding: '2vh', margin: '1vh', color: theme.colors.bonasoUberDarkAccent}}>
                        <strong>Visible When:</strong>
                        <ul>
                            {ind?.logic?.conditions?.map((c) => {
                                let source = ''
                                let val = '';
                                let ind = null;
                                
                                if(c.source_type == 'assessment') ind = assessment.indicators.find((ind) => (ind.id == c.source_indicator))
                                let operator = c.condition_type ? 'Is' : getLabelFromValue('operators', c.operator)
                                if(c.condition_type) val = getLabelFromValue('condition_types', c.condition_type)
                                else if(ind && ['multi', 'single'].includes(ind.type)) val = ind.options.find((o) => (o.id == c.value_option)).name;
                                else if(ind && ['boolean'].includes(ind.type)) val = c.value_boolean ? 'Yes' : 'No'
                                else if(meta.respondent_choices?.[c?.respondent_field]) val = meta.respondent_choices?.[c?.respondent_field].find(f => f.value == c.value_text)?.label;
                                else val = c.value_text;
                                if(c.source_type == 'respondent') source = `Respondent's ${getLabelFromValue('respondent_fields', c.respondent_field)}`;
                                else if(c.source_type == 'assessment') source = `${ind.order+1}. ${ind.name}`
                                return(<li><strong>{source}</strong> <i>{operator}</i> <strong>{val}</strong></li>)
                            })}
                        </ul>
                    </div>}
                </div>))}
            </div>
            <button onClick={onClose}>Close</button>
        </div>
    )
}