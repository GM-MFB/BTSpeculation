import { Routes, Route } from "react-router-dom";
import Overview from "./pages/Overview";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/overview" element={<Overview />} />
    </Routes>
  );
}

export default App;
