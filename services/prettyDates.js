export default function prettyDates(uglyDate, time=false, long=false, ){
    try{
        const dateObject = new Date(uglyDate)
        if(long){
            return dateObject.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        else if(time){
            return dateObject.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
