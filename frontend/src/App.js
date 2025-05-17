import React from "react";
import Home from "./pages/Home";
import "./App.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Welcome from "./pages/Welcome";
import { BrowserRouter, Routes,Route } from 'react-router-dom';

// Inside your App component's return statement:


function App() {
  return (
    <div >
    <ToastContainer position="top-right" autoClose={3000} />
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Welcome />} />
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
