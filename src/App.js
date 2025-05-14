import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import YazarDashboard from "./components/YazarDashboard";
import EditörDashboard from "./pages/EditörDashboard";
import HakemDashboard from "./pages/HakemDashboard";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/yazar" element={<YazarDashboard />} />
          <Route path="/editor" element={<EditörDashboard />} />
          <Route path="/hakem" element={<HakemDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;