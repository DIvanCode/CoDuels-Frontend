import { useEffect, useState } from "react";

import "./styles/index.scss";

function App() {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCount(count + 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [count]);
    return <div>It works</div>;
}

export default App;
