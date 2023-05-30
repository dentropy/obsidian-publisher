import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageRenderer from './PageRenderer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pages/:pageName" element={<PageRenderer />} />
        {/* Add any other routes or components as needed */}
      </Routes>
    </Router>
  );
}

export default App;
