
import './App.css';
import React, { useState, useEffect } from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import GallaryPage from './components/GallaryPage';
import MainPage from './components/MainPage';
import ViewPage from './components/ViewPage';
import { CssBaseline } from '@mui/material';
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";





function App() {


  const getColorMode = () => {
    if (localStorage.hasOwnProperty('colorMode')) {
      if (localStorage.getItem('colorMode') === '深色模式') {
        return true
      }
      if (localStorage.getItem('colorMode') === '浅色模式') {
        return false
      }
      if (localStorage.getItem('colorMode') === '自动') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    } else {
      return true
    }
  }


  
  const darkRef = React.useRef(getColorMode());
  const [dark, _setDark] = useState(darkRef.current);
  const setDark = (value) => { 
    if (value !== darkRef.current) { 
      console.log("darkMode set",value)
      _setDark(value);
      darkRef.current = value;
    }
  }



  const handelDarkModeChanged = (e) => {
    setDark(getColorMode())
  }

  const handelStorageChanged = (e) => {
    if (e.type === 'storage' && e.key === 'colorMode') {
      setDark(getColorMode())
    }
  }


  useEffect(() => {
    window.addEventListener('userDispatchColorModeEvent', handelDarkModeChanged);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handelDarkModeChanged);
    window.addEventListener('storage', handelStorageChanged);

    return () => {
      window.removeEventListener('userDispatchColorModeEvent', handelDarkModeChanged);
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handelDarkModeChanged);
      window.removeEventListener('storage', handelStorageChanged);
    }
  }, [])


  const theme = createTheme({
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: dark ? '#303030' : "#ECEFF1",
            "a: link": {
              color: dark ? '#00796b' : "#00796b",
            },
            "a: visited": {
              color: dark ? '#00796b' : "#00796b",
            },
            "a: active": {
              color: dark ? '#00796b' : "#00796b",
            },
          },
        },
      },
    },

    palette: dark ? {

      primary: {
        main: "#00796B",
      },
      secondary: {
        main: "#d90051",
      },
      button: {
        tag: {
          type: {
            main: "#4a4a4a",
            hover: "#646464"
          },
          value: {
            main: "#4a4a4a",
            hover: "#646464"
          },
          text:"#ffffff",
        },
        iconFunction: {
          main: "#ffffff",
          disabled: "#9e9e9e",
          text: "#ffffff",
          process:"#d90051",
        },
        readAndDownload: {
          main: "#4a4a4a",
          hover: "#646464",
          process: "#d90051",
          buffer:"e0e0e0",
          text:"#ffffff"
        },
        loadMore: {
          main: "#303030",
          hover: "#646464",
          text: "#ffffff"
        },
        gallaryCard: {
          main: "#212121",
        }
      },
      text: {
        primary: "#ffffff",
        secondary: "#dddddd",
      },
      page: {
        background: "#303030",
        shadow: "8px 8px 16px #252525,-8px -8px 16px #3b3b3b"
      },
      search: {
        color: "#3a3a3a",
        text: "#ffffff",
        split:"#3a3a3a"
      }
    }
      :
      {
        primary: {
          main: "#d90051",
        },
        secondary: {
          main: "#00796B",
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

        button: {
          tag: {

            type: {
              main: "#C2185B",
              hover: "#E91E63"
            },
            value: {
              main: "#00796b",
              hover: "#009688"
            },
            text: "#ffffff",
          },
          iconFunction: {
            main: "#000000",
            disabled: "#9e9e9e",
            text: "#ffffff",
            process: "#d90051",
          },
          readAndDownload: {
            main: "#9e9e9e",
            hover: "#bdbdbd",
            process: "#d90051",
            buffer: "e0e0e0",
            text: "#000000"
          },
          loadMore: {
            main: "#ECEFF1",
            hover: "#eeeeee",
            text: "#000000"
          },
          gallaryCard: {
            main: "#ffffff",
          }
        },
        text: {
          primary: "#000000",
          secondary: "#757575",
        },
        page: {
          background: "#ECEFF1",
          shadow: "8px 8px 16px #c4c4c4,-8px -8px 16px #ECEFF1"
        },
        search: {
          color: "#eeeeee",
          text: "#000000",
          split: "#3a3a3a"
        }
      }
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div id='mainContainer' style={{ backgroundColor: theme.palette.page.background, width: "100%" }}    >
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
