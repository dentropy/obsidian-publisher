import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageRenderer from './PageRenderer';
import PageRendererIndex from './PageRenderIndex'
import AxiosNotes from './AxiosNotes';
import AxiosNotesIndex from './AxiosNotesIndex'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pages/:pageName" element={<AxiosNotes />} />
        {/* <Route path="/pages/:pageName" element={<PageRenderer />} /> */}
        <Route path="/" element={<AxiosNotesIndex />} />
        {/* Add any other routes or components as needed */}
      </Routes>
    </Router>
  );
}

export default App;
