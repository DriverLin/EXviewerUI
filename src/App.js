
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import GalleryPage from './components/ui/GalleryPage';
import PopoverNotifier from "./components/utils/PopoverNotifier";
import { useSettingBind } from './components/utils/SettingHooks';
import ViewPage from './components/ui/ViewPage';
import { useWsHandeler } from './components/utils/useSyncDict';
import syncedDB from './components/utils/mobxSyncedState';
import { observer } from "mobx-react";
import DownloadCircularProgress from './components/ui/MainPageComponents/DownloadCircularProgress';
import GalleryCard from './components/ui/MainPageComponents/GalleryCard';
import VScrollCardContainer from './components/ui/MainPageComponents/VScrollCardContainer';
import { action, toJS } from 'mobx';
import MainPage from './components/ui/MainPage';
import { SwitchRouter } from './components/utils/Router';
import { Route, Routes } from 'react-router';
import { HashRouter } from 'react-router-dom';

function App_inner() {
  const wssOrWS = window.location.protocol === "https:" ? "wss:" : "ws:"
  let wsUrl = `${wssOrWS}//${window.location.host}/`
  if (window.location.host.includes("3000")) {
    wsUrl = wsUrl.replace("3000", "7964")
  }

  useWsHandeler(wsUrl + 'download', syncedDB.getEventHandeler('download'))
  useWsHandeler(wsUrl + 'favorite', syncedDB.getEventHandeler('favorite'))
  useWsHandeler(wsUrl + 'card_info', syncedDB.getEventHandeler('card_info'))
  const colorMode = useSettingBind('色彩主题', '亮色')
  const dark = useMemo(() => {
    if (colorMode === "跟随系统") {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      return colorMode === "暗色"
    }
  }, [colorMode])

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#303030' : '#ECEFF1')
  }, [dark])
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
      background: {
        main: "#303030",
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
            main: "#4a4a4a",
            hover: "#646464"
          },
          value: {
            main: "#4a4a4a",
            hover: "#646464"
          },
          text: "#ffffff",
        },
        iconFunction: {
          main: "#ffffff",
          disabled: "#9e9e9e",
          text: "#ffffff",
          process: "#d90051",
        },
        readAndDownload: {
          main: "#4a4a4a",
          hover: "#646464",
          process: "#d90051",
          buffer: "e0e0e0",
          text: "#ffffff"
        },
        loadMore: {
          main: "#303030",
          hover: "#646464",
          text: "#ffffff"
        },
        galleryCard: {
          main: "#212121",
        },
        commentCard: {
          main: "#303030",
          hover: "#303030",
          text: "#ffffff"
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
        split: "#757575"
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
          main: "#ECEFF1",
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
          galleryCard: {
            main: "#ffffff",
          },
          commentCard: {
            main: "#ECEFF1",
            hover: "#ECEFF1",
            text: "#000000"
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

  let serverType = window.serverSideConfigure
  if (serverType) {
    serverType = serverType.type
  } else {
    serverType = { type: "full" }
  }

  const openNew = (pathname, search) => window.open(`/#${pathname}${search}`, "_blank")
  const openCurrent = (pathname, search) => window.location.href = `/#${pathname}${search}`

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PopoverNotifier />
      <div id='mainContainer' style={{ backgroundColor: theme.palette.page.background, width: "100%" }}    >
        <HashRouter>
          <Routes>
            <Route path="*" element={<SwitchRouter />} />
          </Routes>
        </HashRouter>
      </div >
    </ThemeProvider>
  );
}


const ItemsObserver = observer(App_inner);

function App() {
  return <div>
    <ItemsObserver />
  </div>
}

export default App;//最终是不需要在app中observer的 observer会分散到最小组件
