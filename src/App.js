import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home/Home";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import Editor from "./components/Editor/Editor";
import Templates from "./components/Templates/Templates";
import ATSChecker from "./components/ATSChecker/ATSChecker";
import ViewResume from "./components/View/ViewResume";
import ProtectedRoute from "./components/Shared/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ats-checker" element={<ATSChecker />} />
        <Route path="/view/:id" element={<ViewResume />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/templates" element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        } />
        <Route path="/editor/:id" element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;