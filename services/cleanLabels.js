export default function cleanLabels(str) {
    /*
    Accepts a string and returns a more readable version of it.
    */
    if (typeof str !== 'string') {
        console.warn('cleanLabels requires a string, received:', str);
        return '';
    }

    str = str.replace('_id', ''); //remove the id suffix found in some fields
    str = str.replace(/_/g, ' '); //replace underscores with spaces
    str = str.replace('kp ', 'Key Population '); //spell out common abbreviations
    str = str.trim(); //trim

    const words = str.split(' ');
    const cleaned = words.map(w =>
        w.charAt(0).toUpperCase() + w.slice(1) //capitalize each word
    );

    return cleaned.join(' '); //return a string
}