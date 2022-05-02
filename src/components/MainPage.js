
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CachedIcon from '@mui/icons-material/Cached';
import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileDownloadOffIcon from '@mui/icons-material/FileDownloadOff';
import HomeIcon from '@mui/icons-material/Home';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LogoDevIcon from '@mui/icons-material/LogoDev';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import FloatAddButton from './MainPageComponents/FloatAddButton';
import LeftMenu from './MainPageComponents/LeftMenu';
import LongClickMenu from './MainPageComponents/LongClickMenu';
import OnlineManinPage from './MainPageComponents/OnlineMainPage';
import TopSearchBar from './MainPageComponents/TopSearchBar';
import { ServerSyncKeepAlive, useSyncGallarys, useSyncState } from './utils/GlobalActionHandeler';
import log from './utils/Logger';
import { notifyMessage } from './utils/PopoverNotifier';
import SecnodConfirmDialog from './utils/SecnodConfirmDialog';
import { useSettingBind } from './utils/Settings';
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


const openCurrent = (url) => {
    window.location.href = "/#" + url
}

const openNewTab = (url) => {
    window.open("/#" + url, "_blank")
}

export default function MainPage(props) {
    const usel = useLocation()
    const location = props.location ? props.location : usel

    const [scrollTop, setScrollTop] = useState(0)
    const [gallarys, setGallarys] = useState([]);
    const pageOffset = useRef(0)
    const [states, setStates] = useState({})
    const searhLocal = useSettingBind("搜索本地画廊", false)
    const apiUrl = useMemo(() => {
        const urlMap = {
            "/": "/list/?1=1",
            "/search": `/list/${location.search}${searhLocal ? "&search_and_merge_local=true" : ""}`,
            "/watched": "/list/watched?1=1",
            "/popular": "/list/popular?1=1",
            "/favorites": "/list/favorites.php?1=1",
            "/downloaded": "/api/data"
        }
        return urlMap[location.pathname]
    }, [location])

    useEffect(() => {
        pageOffset.current = 0
        setGallarys([])
        log(apiUrl)
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
            log("requestData", targeturl)
            const response = await fetch(targeturl)
            if (response.ok) {
                const data = await response.json()
                await setGallarys(prev => mergeGallary(prev, data))
                log(data)
                pageOffset.current += 1
                log("requestData over")
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
        props.openCurrent("/search", `?f_search=${encodeURIComponent(text)}`, "")
        // console.log(props)
    }

    const [leftMenuOpen, setLeftMenuOpen] = useState(false)
    let menuItems = [
        {
            onClick: () => {
                props.openCurrent("/", "")
            },
            icon: <HomeIcon />,
            text: "主页"
        }, {
            onClick: () => {
                props.openCurrent("/watched", "")
            },
            icon: <SubscriptionsIcon />,
            text: "订阅"
        }, {
            onClick: () => {
                props.openCurrent("/popular", "")
            },
            icon: <LocalFireDepartmentIcon />,
            text: "热门"
        }, {
            onClick: () => {
                props.openCurrent("/favorites", "")
            },
            icon: <FavoriteIcon />,
            text: "收藏"
        },
        {
            onClick: () => {
                props.openCurrent("/downloaded", "")
            },
            icon: <DownloadIcon />,
            text: "下载"
        },
        {
            onClick: () => {
                props.openNew("/setting", "")
            },
            icon: <SettingsIcon />,
            text: "设置"
        },
        {
            onClick: () => {
                props.openNew("/downloadlog", "")
            },
            icon: <LogoDevIcon />,
            text: "logger"
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
        //未完成的下载
        const items = []
        console.log(gid, token, name , states[Number(gid)])
        const downloaded = states[Number(gid)] ? states[Number(gid)][2] > -2 : false
        const favoted = states[Number(gid)] ? states[Number(gid)][1] > -1 : false
        let can_continue_download = downloaded && (states[Number(gid)][2] != states[Number(gid)][3]) 
        items.push({
            text: "阅读",
            onClick: () => { getRead(gid, token) },
            icon: <AutoStoriesIcon />
        })
        if(can_continue_download){
            items.push({
                text: "继续下载",
                onClick: () => { addDownload(gid, token) },
                icon: <FileDownloadIcon />
            })
        }

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
                log("delete", gid, token)
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
    
    const reDownloadAll = () => {
        fetch("/redownloadall").then(res => res.json()).then(res => {
            console.log(res)
        })
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
    const re_download_all = {
        name: "",
        icon:<PlayArrowIcon/>,
        onClick: reDownloadAll
    }


    const normalActions = [re_download_all,action_gototop, action_randomsort, action_namehashsort, action_refresh]
    const downloadPageActions = [re_download_all,action_gototop, action_randomsort, action_namehashsort, action_refresh,]




    return (
        <React.Fragment >
            <FloatAddButton
                actions={normalActions}
                scrollTop={scrollTop}
            />
            <SecnodConfirmDialog
                {...deleteSecnodConfirm}
            />
            <LongClickMenu
                pos={pos}
                setPos={setPos}
                items={longClickItems}
                title={longClickedName}
            />
            <LeftMenu
                open={leftMenuOpen}
                onClose={() => { setLeftMenuOpen(false) }}
                Items={menuItems}
            />
            <TopSearchBar
                leftButtonClick={() => { setLeftMenuOpen(true) }}
                doSearch={doSearch}
                scrollTop={scrollTop}
                location={location}
            />
            <OnlineManinPage
                key={refreshToken}
                loading={loading}
                requestData={requestData}
                gallarys={gallarys}
                states={states}
                longClickCallback={longClickCallback}
                setScrollTop={setScrollTop}
                openCurrent={props.openCurrent}
                openNew={props.openNew}
            />
            <ServerSyncKeepAlive refreshKey={refreshToken} />
        </React.Fragment>
    )
}