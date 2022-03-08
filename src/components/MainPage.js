
import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineManinPage from './MainPageComponents/OnlineMainPage';
import { notifyMessage } from './utils/PopoverNotifier';
import TopSearchBar from './MainPageComponents/TopSearchBar'
import { useLocation } from 'react-router';
import LeftMenu from './MainPageComponents/LeftMenu'
import FloatAddButton from './MainPageComponents/tools/FloatAddButton';
import HomeIcon from '@mui/icons-material/Home';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SortIcon from '@mui/icons-material/Sort';
import DownloadIcon from '@mui/icons-material/Download';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileDownloadOffIcon from '@mui/icons-material/FileDownloadOff';

import LongClickMenu from './MainPageComponents/LongClickMenu'
import { useSettingBind } from './utils/Settings';
import { useSyncGallarys, useSyncState, ServerSyncKeepAlive } from './utils/GlobalActionHandeler'
import SecnodConfirmDialog from './utils/SecnodConfirmDialog';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';



import ShuffleIcon from '@mui/icons-material/Shuffle';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import CachedIcon from '@mui/icons-material/Cached';





const randomSort = (arr) => {
    return arr.sort(() => Math.random() - 0.5)
}



const nameSort = (arr) => {
    const nameDict = {}
    const firstShow = []
    for (let item of arr) {
        const hashName = item.name.replace(/\[.*?\]|\(.*?\)|【.*?】|（.*?）|\s+/g, "")
        if (nameDict[hashName] !== undefined) {
            if (item.lang === "chinese") {
                //如果是中文画廊，则放在前面
                nameDict[hashName].unshift(item)
            } else {
                //如果是英文画廊，则放在后面
                nameDict[hashName].push(item)
            }
        } else {
            nameDict[hashName] = [item]
        }
        if (firstShow.indexOf(hashName) === -1) {
            firstShow.push(hashName)
        }
    }
    const newList = []
    for (let hashName of firstShow) {
        newList.push(...nameDict[hashName])
    }
    return newList
}

const mergeGallary = (arr1, arr2) => {
    const result = []
    const set = new Set()
    for (let arr of [arr1, arr2]) {
        for (let item of arr) {
            if (!set.has(item.gid)) {
                set.add(item.gid)
                result.push(item)
            }
        }
    }
    return result
}


const openCurrentTab = (url) => {
    window.location.href = "/#" + url
}

const openNewTab = (url) => {
    window.open("/#" + url, "_blank")
}

export default function MainPage(props) {
    const [gallarys, setGallarys] = useState([]);
    const pageOffset = useRef(0)
    const [states, setStates] = useState({})
    const location = useLocation()

    const apiUrl = useMemo(() => {
        const urlMap = {
            "/": "/list/?1=1",
            "/search": `/list/${location.search}`,
            "/watched": "/list/watched?1=1",
            "/popular": "/list/popular?1=1",
            "/favorites": "/list/favorites.php?1=1",
            "/downloaded": "/api/data"
        }
        return urlMap[location.pathname]
    }, [location])

    const loadFromAPIDATA = () => { }
    const loadFromDB = () => { }


    useEffect(() => {
        pageOffset.current = 0
        setGallarys([])
        console.log(apiUrl)
        getRefresh()
        requestData()

    }, [apiUrl])


    const syncState = useSyncState()
    const syncGallarys = useSyncGallarys()
    useEffect(() => {
        setStates(syncState)
    }, [syncState])


    useEffect(() => {
        if (apiUrl === "/api/data") {
            if (syncGallarys.length === 0) return
            if (syncGallarys.length !== gallarys.length) {
                setGallarys(syncGallarys)
            }
        }
    }, [syncGallarys])


    const lock = useRef(false)
    const [loading, setLoading] = useState(false)
    const requestData = async () => {
        if (apiUrl === "/api/data") {
            return
        } else {
            if (lock.current) return
            lock.current = true
            setLoading(true)
            const targeturl = `${apiUrl}&page=${pageOffset.current}`
            console.log("requestData", targeturl)
            const response = await fetch(targeturl)
            if (response.ok) {
                const data = await response.json()
                setGallarys(prev => mergeGallary(prev, data))
                console.log(data)
                pageOffset.current += 1
                console.log("requestData over")
                lock.current = false
                setLoading(false)
                return true
            } else {
                const text = await response.text()
                try {
                    const info = JSON.parse(text)
                    notifyMessage("error", JSON.parse(info.detail))
                } catch (error) {
                    notifyMessage("error", text)
                }
                lock.current = false
                setLoading(false)
                return false
            }

        }


    }



    const doSearch = (text) => {
        console.log("doSearch", text)
        openCurrentTab(`/search?f_search=${encodeURIComponent(text)}`)
    }






    const [leftMenuOpen, setLeftMenuOpen] = useState(false)
    let menuItems = [
        {
            onClick: () => {
                openCurrentTab("/")
            },
            icon: <HomeIcon />,
            text: "主页"
        }, {
            onClick: () => {
                openCurrentTab("/watched")
            },
            icon: <SubscriptionsIcon />,
            text: "订阅"
        }, {
            onClick: () => {
                openCurrentTab("/popular")
            },
            icon: <LocalFireDepartmentIcon />,
            text: "热门"
        }, {
            onClick: () => {
                openCurrentTab("/favorites")
            },
            icon: <FavoriteIcon />,
            text: "收藏"
        },
        {
            onClick: () => {
                openCurrentTab("/downloaded")
            },
            icon: <DownloadIcon />,
            text: "下载"
        },
        {
            onClick: () => {
                openNewTab("/setting")
            },
            icon: <SettingsIcon />,
            text: "设置"
        }
    ]

    const [pos, setPos] = useState([-1, -1])
    const [longClickItems, setLongClickItems] = useState([])
    const [longClickedName, setLongClickedName] = useState("")


    const getRead = (gid, token) => openNewTab(`/viewing/${gid}/${token}/`)
    const addDownload = async (gid, token) => {
        const response = await fetch(`/download/${gid}_${token}`)
        if (response.ok) {
            notifyMessage("success", "已添加下载")
        } else {
            const text = await response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", JSON.parse(info.detail))
            } catch (error) {
                notifyMessage("error", text)
            }
        }

    }
    const rmDownload = async (gid, token) => {
        const response = await fetch(`/delete/${gid}_${token}`)
        if (response.ok) {
            notifyMessage("success", "已删除下载")
        } else {
            const text = await response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", JSON.parse(info.detail))
            } catch (error) {
                notifyMessage("error", text)
            }
        }
    }

    const favoIndex = useSettingBind("收藏夹", 9)

    const addFavo = async (gid, token) => {
        const response = await fetch(`/addfavo/${gid}_${token}/${favoIndex}`)
        if (response.ok) {
            notifyMessage("success", "已添加收藏")
        } else {
            const text = await response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", JSON.parse(info.detail))
            } catch (error) {
                notifyMessage("error", text)
            }
        }

    }
    const rmFavo = async (gid, token) => {
        const response = await fetch(`/rmfavo/${gid}_${token}`)
        if (response.ok) {
            notifyMessage("success", "已移除收藏")
        } else {
            const text = await response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", JSON.parse(info.detail))
            } catch (error) {
                notifyMessage("error", text)
            }
        }
    }






    const longClickCallback = (gid, token, name, x, y) => {
        const items = []
        const downloaded = states[Number(gid)] ? states[Number(gid)][2] > -2 : false
        const favoted = states[Number(gid)] ? states[Number(gid)][1] > -1 : false
        items.push({
            text: "阅读",
            onClick: () => { getRead(gid, token) },
            icon: <AutoStoriesIcon />
        })
        if (downloaded) {
            items.push({
                text: "删除下载",
                onClick: () => { handelSenondConfirm(gid, token, name) },
                icon: <FileDownloadOffIcon />
            })
        } else {
            items.push({
                text: "下载",
                onClick: () => { addDownload(gid, token) },
                icon: <FileDownloadIcon />
            })
        }
        if (favoted) {
            items.push({
                text: "取消收藏",
                onClick: () => { rmFavo(gid, token) },
                icon: <FavoriteBorderIcon />
            })
        } else {
            items.push({
                text: "收藏",
                onClick: () => { addFavo(gid, token) },
                icon: <FavoriteIcon />
            })
        }
        setLongClickedName(name)
        setLongClickItems(items)
        setPos([x, y])
    }



    const [deleteSecnodConfirm, setDeleteSecnodConfirm] = useState({})

    const handelSenondConfirm = (gid, token, title) => {
        setDeleteSecnodConfirm({
            title: title,
            open: true,
            onConfirm: () => {
                console.log("delete", gid, token)
                rmDownload(gid, token)
                setDeleteSecnodConfirm({})
            },
            handleClose: () => { setDeleteSecnodConfirm({}) }
        })
    }



    const [refreshToken, setRefreshToken] = useState(Math.random())
    const getRefresh = () => {
        setRefreshToken(Math.random())
    }


    const randomSortGallary = () => {
        console.time("randomSortGallary")
        getRefresh()
        setGallarys(gallarys => randomSort(gallarys))
        console.timeEnd("randomSortGallary")
    }

    const nameHashSortGallary = () => {
        console.time("nameHashSortGallary")
        getRefresh()
        setGallarys(gallarys => nameSort(gallarys))
        console.timeEnd("nameHashSortGallary")
    }

    const goToTop = () => {
        getRefresh()
    }

    const refreshGallary = () => {
        pageOffset.current = 0
        setGallarys([])
        getRefresh()
        requestData()
    }

    const action_gototop = {
        name: "回到顶部",
        icon: <ArrowUpwardIcon />,
        onClick: goToTop
    }
    const action_randomsort = {
        name: "随机排序",
        icon: <ShuffleIcon />,
        onClick: randomSortGallary
    }
    const action_namehashsort = {
        name: "名称排序",
        icon: <SortByAlphaIcon />,
        onClick: nameHashSortGallary
    }
    const action_refresh = {
        name: "刷新",
        icon: <CachedIcon />,
        onClick: refreshGallary
    }


    const normalActions = [action_gototop, action_randomsort, action_namehashsort, action_refresh]
    const downloadPageActions = [action_gototop, action_randomsort, action_namehashsort, action_refresh]

    return (
        <React.Fragment >
            <FloatAddButton actions={normalActions} />
            {/* <SecnodConfirmDialog title={"我是标题"} open={true} onClose={() => { }} onConfirm={()=>{}}/> */}
            <SecnodConfirmDialog {...deleteSecnodConfirm} />
            <LongClickMenu pos={pos} setPos={setPos} items={longClickItems} title={longClickedName} />
            <LeftMenu open={leftMenuOpen} onClose={() => { setLeftMenuOpen(false) }} Items={menuItems}  ></LeftMenu>
            <TopSearchBar leftButtonClick={() => { setLeftMenuOpen(true) }} doSearch={doSearch} />
            <OnlineManinPage
                key={refreshToken + 1}
                loading={loading}
                requestData={requestData}
                gallarys={gallarys}
                states={states}
                longClickCallback={longClickCallback}
            />
            <ServerSyncKeepAlive key={refreshToken + 2} />
        </React.Fragment>
    )
}