export default function prettyDates(uglyDate, style='basic'){
    try{
        const dateObject = new Date(uglyDate)
        if(style=='long'){
            return dateObject.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        else{
            return dateObject.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
    catch(err){
        console.warn('Not a valid date!')
        return;
    }
}
