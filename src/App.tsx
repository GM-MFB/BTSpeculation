import { Routes, Route } from "react-router-dom";
import Overview from "./pages/Overview";
import Advanced from "./pages/Advanced";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/overview" element={<Overview />} />
      <Route path="/advanced" element={<Advanced />} />
    </Routes>
  );
}

export default App;
