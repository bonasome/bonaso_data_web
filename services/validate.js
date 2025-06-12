export default function validate (target, phone=false) {
    const name = target.name
    const value = target.value
    const required = target.required
    const type = target.type
    const max = target.max
    let field = name.charAt(0).toUpperCase() + name.slice(1);

    let errors = []
    if(required == true){
        if(value == '' || value == null || value == undefined){
            errors.push(`${field} is required.`)
        }
    }
    if(max && value != ''){
        if(value.length > max){
            errors.push(`${field} has a maximum length of ${max} characters`)
        }
    }
    if(type == 'email' && value != ''){
        const pattern = /^\S+@\S+$/i;
        const checkEmail = pattern.test(value);
        if(!checkEmail){
            errors.push(`Please enter a valid email address for field ${field}.`)
        }
    }
    if(type == 'number' && value != ''){
        const checkNumeric = !isNaN(Number(value));
        if(!checkNumeric){
            errors.push(`Please enter a valid number for question ${field}.`) 
        }
    }
    if(phone && value != ''){
        const pattern = /^\+\d{1,3}\s\d{6,10}$/;
        const checkPhone = pattern.test(value);
        if(!checkPhone){
            errors.push(`Please enter a valid phone number, including the country code for field ${field}.`)
        }
    }
    return errors;
}