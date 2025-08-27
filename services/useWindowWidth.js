import { useEffect, useState } from "react";

export default function useWindowWidth() {
    /*
    Helper function that can be used in a component to get the users screen size in pixels (as an integer).
    */
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return width; 
}