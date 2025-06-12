import { useParams } from 'react-router-dom';

export default function ViewIndicator(){
    const { id } = useParams();
    return(
        <p>Viewing project {id}, oh man this is gonna be great when I actually code this page...</p>
    )
}