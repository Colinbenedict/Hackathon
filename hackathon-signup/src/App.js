import React from "react";
import TeamRegistrationForm from "./TeamRegistrationForm";
import SuccessPage from "./SuccessPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import HypeSongPlayer from "./HypeSongPlayer";

function App() {
  return (
    <Router>
      <div style={{ padding: "2rem", maxWidth: 600, margin: "auto" }}>
        <HypeSongPlayer />
        <Routes>
          <Route path="/" element={<TeamRegistrationForm />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
