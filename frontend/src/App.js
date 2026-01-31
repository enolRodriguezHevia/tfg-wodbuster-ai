// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import SignUp from "./components/Signup";
import Profile from "./pages/Profile";
import Benchmarks from "./pages/Benchmarks";
import Entrenamientos from "./pages/Entrenamientos";
import WodsCrossFit from "./pages/WodsCrossFit";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route path="/entrenamientos" element={<Entrenamientos />} />
        <Route path="/wods-crossfit" element={<WodsCrossFit />} />
      </Routes>
    </Router>
  );
}

export default App;


