
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


const formatTime = (time, format) => {
    const date = new Date(Number(time + "000"))
    var o = {
        "M+": date.getMonth() + 1, // 月份
        "d+": date.getDate(), // 日
        "h+": date.getHours(), // 小时
        "m+": date.getMinutes(), // 分
        "s+": date.getSeconds(), // 秒
        "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
        "S": date.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (date.getFullYear() + ""));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return format;
}
const translateGdata2CardData = (g_data) => {
    return {
        gid: g_data.gid,
        token: g_data.token,
        imgSrc: `/cover/${g_data.gid}_${g_data.token}.jpg`,
        name: g_data.title_jpn || g_data.title,
        rank: Number(g_data.rating),
        category: g_data.category,
        uploadtime: formatTime(Number(g_data.posted), 'yy-MM-dd hh:mm'),
        lang: g_data.tags.indexOf("language:chinese") !== -1 ? "chinese" : "",
        pages: Number(g_data.filecount),
        tags: g_data.tags,
        download: -2,
        favo: -1
    }
}

const localSearchAction = (g_data, searchText) => {
    let inputText = decodeURIComponent(searchText.replace("?f_search=", ""))
    console.log("[", inputText, "]")
    let tags = inputText.match(/[A-Za-z0-9]+:"[^\$]+\$"/g)
    if (tags === null) tags = [];
    let tmpInputCopy = inputText
    tags.forEach(item => {
        tmpInputCopy = tmpInputCopy.replace(item, "")
    })
    let words = tmpInputCopy.match(/[\u0800-\u4e00\u4E00-\u9FA5A-Za-z0-9_]+/g)
    if (words === null) words = [];
    for (let i = 0; i < tags.length; i++) {
        tags[i] = tags[i].replace(/\$|"/g, "")
    }
    console.log("tags:", tags, "words:", words)
    return g_data.filter(item => {
        let flag = true;
        tags.forEach(tag => {
            if (item.tags.indexOf(tag) === -1) flag = false;
        })
        words.forEach(word => {
            if (item.name.indexOf(word) === -1) flag = false;
        })
        return flag;
    })
}



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







export default function StaticMainPage(props) {
    const [gallarys, setGallarys] = useState([]);
    const [loading, setLoading] = useState(true)

    const g_dataRef = useRef([])


    const doSearch = async (text) => {
        console.log("doSearch", text)
        console.time("doSearch")
        const filtedGallarys = localSearchAction(g_dataRef.current, text).map(item => translateGdata2CardData(item))
        getRefresh()
        await setGallarys(filtedGallarys)
        setLoading(false)
        console.timeEnd("doSearch")

    }


    useEffect(async () => {
        if(window.serverSideConfigure){
            if (window.serverSideConfigure.type === "staticApi") {
                console.time("get gallarys from static api")
                const resp = await fetch("/api/data")
                const data = await resp.json()
                g_dataRef.current = data
                console.timeEnd("get gallarys from static api")
                await setGallarys(data.map(item => translateGdata2CardData(item)))
                setLoading(false)
                
            } else if (window.serverSideConfigure.type === "Data.db") {
                console.time("get gallarys from Data.db")
                const data = await window.loadDataLocaly()
                console.timeEnd("get gallarys from Data.db")
                g_dataRef.current = data
                await setGallarys(data.map(item => translateGdata2CardData(item)))
                setLoading(false)
                
            } else {
                console.error("unsupport window.serverSideConfigure.type")
            }
        }else{
            console.error("window.serverSideConfigure undefined")
        }
        
    }, [])


    const [leftMenuOpen, setLeftMenuOpen] = useState(false)
    let menuItems = [
        {
            onClick: () => {
                openNewTab("/setting")
            },
            icon: <SettingsIcon />,
            text: "设置"
        }
    ]



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
        getRefresh()
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
            <LeftMenu open={leftMenuOpen} onClose={() => { setLeftMenuOpen(false) }} Items={menuItems}  ></LeftMenu>
            <TopSearchBar leftButtonClick={() => { setLeftMenuOpen(true) }} doSearch={doSearch} />
            <OnlineManinPage
                key={refreshToken + 1}
                loading={loading}
                requestData={() => { }}
                gallarys={gallarys}
                states={{}}
                longClickCallback={() => { }}
            />
        </React.Fragment>
    )
}