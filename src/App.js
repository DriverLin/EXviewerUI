
import './App.css';
import React from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import GallaryPage from './components/GallaryPage';
import MainPage from './components/MainPage';
import ViewPage from './components/ViewPage';
import { useLocation, } from "react-router-dom";
import { CssBaseline } from '@mui/material';
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";


// const theme = createTheme({
//   palette: {
//     type: 'dark',
//     primary: {
//       main: "#d90051",
//     },
//     secondary: {
//       main: "#dadada",
//     },
//   },
// });

const dark = false
const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: dark ? '#303030' : "#ffffff",
        },
      },
    },
  },

  palette: dark ? {

    primary: {
      main: "#d90051",
    },
    secondary: {
      main: "#dadada",
    },
    text: {
      main: "#DDDDDD",
      secondary: "#dddddd",
    },
    background: {
      main: "#303030",
      secondary: "#3a3a3a",
      mainCard: "#191919",
      read: "#4a4a4a",
      readHover: "#646464",
      tag: "#4a4a4a",
      tagHover: "#646464",
      pageShadow: "8px 8px 16px #252525,-8px -8px 16px #3b3b3b"
    },
    iconButton: {
      main: "#ffffff",
      disabled: "#757575",
    },
  } : {
    primary: {
      main: "#d90051",
    },
    secondary: {
      main: "#00796b",
    },
    text: {
      main: "#000000",
      secondary: "#757575",
    },
    background: {
      main: "#ffffff",
      secondary: "#fefefe",
      mainCard: "#fdfdfd",
      read: "#9E9E9E",
      readHover: "#BDBDBD",
      tag: "#00796b",
      tagHover: "#009688",
      pageShadow: "8px 8px 16px #c4c4c4,-8px -8px 16px #ffffff"
    },
    iconButton: {
      main: "#000000",
      disabled: "#9e9e9e",
    },
  }
});







function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div id='mainContainer' style={{ backgroundColor: theme.palette.background.main, width: "100%" }}    >
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
    </ThemeProvider>
  );
}

export default App;
