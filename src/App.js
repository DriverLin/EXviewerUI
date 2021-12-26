
import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import Button from '@mui/material/Button';

import GallaryCard from './components/GallaryCard';
import GallaryPage from './components/GallaryPage';
import MainPage from './components/MainPage';
import TagPanel from './components/GallaryPageComponents/TagPanel';
import TestScript from './components/TestScript';
import ViewPage from './components/ViewPage';
import RevSlider from './components/RevSlider';
import TwoWaySwiper from './components/TwoWaySwiper';
import MultPageSwiper from './components/MultPageSwiper';

// import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";
import CommentPanel from './components/GallaryPageComponents/CommentPanel';
import PreviewPanel from './components/GallaryPageComponents/PreviewPanel';
import InfoPanel from './components/GallaryPageComponents/InfoPanel';








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
