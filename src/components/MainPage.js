
import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineManinPage from './MainPageComponents/OnlineMainPage';
import { notifyMessage } from './utils/PopoverNotifier';
import TopSearchBar from './MainPageComponents/TopSearchBar'
import { useLocation } from 'react-router';

import LeftMenu from './MainPageComponents/LeftMenu'

import HomeIcon from '@mui/icons-material/Home';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SortIcon from '@mui/icons-material/Sort';
import DownloadIcon from '@mui/icons-material/Download';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileDownloadOffIcon from '@mui/icons-material/FileDownloadOff';

import LongClickMenu from './MainPageComponents/LongClickMenu'
import { useSettingBind } from './utils/Settings';


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
    const ws = useRef(null);
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


    useEffect(() => {
        pageOffset.current = 0
        setGallarys([])
        console.log(apiUrl)
        requestData()
        closeWS()
        initWS()
    }, [apiUrl])

    const onWSMessage = (msg) => {
        const data = JSON.parse(msg.data)
        console.log("recv", data)
        if (data.type === "gallary") { //下载界面才响应
            if (apiUrl === "/api/data") {
                setGallarys(prev => {
                    console.log("收到了", data.gallary.length, '条数据  原有', prev.length)
                    return prev.length === data.gallary.length ? prev : data.gallary
                })//直接全同步 且避免乱序重排
            }
        } else if (data.type === "state") {//全部界面都响应 直接替换当前state
            setStates(prevState => {//    {gid:[downloading,favonum,downloadnum]......}
                return {
                    ...prevState,
                    ...data.state
                }
            })
        }
    }
    const initWS = () => {
        if (ws.current != null) {
            closeWS()
        }
        else {
            const wssOrWS = window.location.protocol === "https:" ? "wss:" : "ws:"
            let wsUrl = `${wssOrWS}//${window.location.host}/ws`
            if (window.location.host.includes(":3000")) {
                console.log("dev")
                //别部署在3000
                wsUrl = wsUrl.replace(":3000", ":8080")
            }
            ws.current = new WebSocket(wsUrl)
            ws.current.onmessage = onWSMessage
        }
    }

    const closeWS = () => {
        if (ws.current != null) {
            ws.current.onmessage = null
            ws.current.close()
            ws.current = null
        }
    }

    const lock = useRef(false)
    const [loading, setLoading] = useState(false)
    const requestData = async () => {
        if (apiUrl === "/api/data") return

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



    const doSearch = (val) => {
        console.log("doSearch", val)
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
                onClick: () => { rmDownload(gid, token) },
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




    return (
        <React.Fragment >
            <LongClickMenu pos={pos} setPos={setPos} items={longClickItems} title={longClickedName} />
            <LeftMenu open={leftMenuOpen} onClose={() => { setLeftMenuOpen(false) }} Items={menuItems}  ></LeftMenu>
            <TopSearchBar leftButtonClick={() => { setLeftMenuOpen(true) }} doSearch={doSearch} />
            <OnlineManinPage
                loading={loading}
                requestData={requestData}
                gallarys={gallarys}
                states={states}
                longClickCallback={longClickCallback}
            />
        </React.Fragment>
    )
}