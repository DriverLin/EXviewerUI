
import './App.css';
import React from 'react';

import GallaryPage from './components/GallaryPage';
import MainPage from './components/MainPage';
import ViewPage from './components/ViewPage';

import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";


function App() {
  return (
    <div >
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/search" element={<MainPage />} />
          <Route path="/watched" element={<MainPage />} />
          <Route path="/popular" element={<MainPage />} />
          <Route path="/favorites" element={<MainPage />} />
          <Route path="/downloaded" element={<MainPage />} />

          <Route path="/g/:id/:token/" element={<GallaryPage />} />
          <Route path="/viewing/:id/:token/" element={<ViewPage />} />
        </Routes>
      </HashRouter>
    </div >
  );
}

export default App;
