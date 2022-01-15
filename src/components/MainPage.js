
import React, { useState, useEffect, useRef } from 'react';
import GallaryCard from './MainPageComponents/GallaryCard'
import useMediaQuery from '@mui/material/useMediaQuery';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { makeStyles } from '@mui/styles';
import TopSearchBar from './MainPageComponents/TopSearchBar'
import LeftMenu from './MainPageComponents/LeftMenu'
import HomeIcon from '@mui/icons-material/Home';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SortIcon from '@mui/icons-material/Sort';
import DownloadIcon from '@mui/icons-material/Download';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import LinearProgress from '@mui/material/LinearProgress';

import { useLocation } from "react-router-dom";
import KeyboardController from '../KeyboardController';



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
        downloaded: true,
        favo: false,//下载页面 不显示是否收藏过
        lang: g_data.tags.indexOf("language:chinese") !== -1 ? "chinese" : "",
        pages: Number(g_data.filecount),
        tags: g_data.tags,
        process: g_data.hasOwnProperty("process") ? g_data.process : [0, 0]
        //在前段判断是否有process字段  避免了对于DB模式的改造以及污染
        //没有则是[0,0]
    }
}

export default function MainPage(props) {
    const locationProps = useLocation()
    const currrentUrl = () => locationProps.pathname

    const matches = useMediaQuery('(min-width:830px)');
    const small_matches = useMediaQuery('(min-width:560px)');
    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const useStyles = makeStyles((theme) => ({
        root: {
            flexGrow: 1,
            margin: small_matches ? "48px" : "8px",
            marginTop: 45,
        },
    }));
    const classes = useStyles();

    const [loadingBar, setLoadingBar] = useState(true)
    const [galaryList, setgalaryList] = useState([]);


    const gallaryListRef = useRef(null)
    const gidSet = useRef(null)
    const cacheAll = useRef(null)
    const lock = useRef(null)
    const currentPageNum = useRef(null)
    const apiUrl = useRef(null)
    const loadover = useRef(null)



    const openNewTab = (url) => {
        window.open("/#" + url, "_blank")
    }
    const openCurrentTab = (url) => {
        window.location.href = "/#" + url
    }


    const init_AllDATA_API = () => {
        fetch("/api/data")
            .then(res => res.json())
            .then(data => {
                cacheAll.current = data.map(item => translateGdata2CardData(item));
                // console.log(cacheAll.current)
                localSearchAction()
                requestNextPage()
            })
    };


    const init_WASMSQL_API = () => {
        window.loadDataLocaly((mapdata, listdata) => {
            cacheAll.current = listdata.map(gid_token => translateGdata2CardData(mapdata[gid_token]))
            localSearchAction()
            requestNextPage()
        })
    }

    const randomSort = () => {
        cacheAll.current = cacheAll.current.sort(() => Math.random() - 0.5)
        gallaryListRef.current = []
        requestNextPage()
    }

    const currentApiFlag = () => `${apiUrl.current}_${cacheAll.current === null}`


    const requestNextPage = () => {
        if (lock.current) return;
        lock.current = true;
        const storedApiFlag = currentApiFlag()
        if (cacheAll.current === null) {
            if (loadover.current) return;
            setLoadingBar(true)
            const targetUrl = apiUrl.current + `&page=${currentPageNum.current}`
            console.log("开始请求nextPage...", targetUrl)
            fetch(targetUrl)
                .then(res => res.json())
                .then(res => {
                    console.log("storedApiFlag", storedApiFlag)
                    console.log("currentApiFlag", currentApiFlag())

                    if (storedApiFlag === currentApiFlag()) {
                        if (res.length === 0) {
                            loadover.current = true
                        }
                        res.forEach(item => {
                            if (!gidSet.current.has(item.gid)) {
                                gallaryListRef.current.push(item)
                                gidSet.current.add(item.gid)
                            } else {
                                console.log("duplicate", item.gid)
                            }
                        })
                        setgalaryList([...gallaryListRef.current])
                    } else {
                        console.log("数据已过期")
                    }
                    lock.current = false;
                    setLoadingBar(false)
                    console.log("请求结束", res)
                }).catch(err => {
                    console.log(err)
                })
            currentPageNum.current = currentPageNum.current + 1
        } else {
            console.log("静态加载...")
            setLoadingBar(false)
            const totalLen = cacheAll.current.length;
            const currentlen = gallaryListRef.current.length;
            const endlen = currentlen + 25 > totalLen ? totalLen : currentlen + 25;
            for (let i = currentlen; i < endlen; i++) {
                gallaryListRef.current.push(cacheAll.current[i])
            }
            setgalaryList([...gallaryListRef.current])
            lock.current = false;
            setLoadingBar(false)
        }
    }

    const localSearchAction = () => {
        let inputText = decodeURIComponent(locationProps.search.replace("?f_search=", ""))
        console.log("[", inputText, "]")
        if (cacheAll.current === null) {

        } else {
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
            cacheAll.current = cacheAll.current.filter(item => {
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
    }

    //对当前画廊进行按名字的hash排序
    const currentHashSort = () => {
        const nameDict = {}
        const firstShow = []
        for (let item of gallaryListRef.current) {
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
        gallaryListRef.current = newList
        setgalaryList(newList)
    }

    const initPageFunc = () => {
        gallaryListRef.current = []
        gidSet.current = new Set()
        cacheAll.current = null
        lock.current = false;
        currentPageNum.current = 0;
        apiUrl.current = null
        loadover.current = false;
        setgalaryList([])

        const usingUrl = currrentUrl()

        console.log("初始化页面")
        console.log("window.serverSideConfigure.type", window.serverSideConfigure.type)
        console.log("Data.db ? ", window.serverSideConfigure.type === "Data.db")
        console.log("static ? ",
            (window.serverSideConfigure.type === "staticApi"
                || localStorage.getItem("offline_mode") === "true"
                || usingUrl === "/downloaded")
        )

        if (window.serverSideConfigure.type === "Data.db") {
            init_WASMSQL_API()
        } else if (
            window.serverSideConfigure.type === "staticApi"
            || localStorage.getItem("offline_mode") === "true"
            || usingUrl === "/downloaded"
        ) {
            init_AllDATA_API()
        } else {
            const urlMap = {
                "/": "/list/?0=0",
                "/search": "/list/" + locationProps.search,
                "/watched": "/list/watched?0=0",
                "/popular": "/list/popular?0=0",
                "/favorites": "/list/favorites.php?0=0",
            }
            apiUrl.current = urlMap[usingUrl]
            console.log("apiUrl.current", usingUrl, "->", apiUrl.current)
            requestNextPage()
        }
    }
    

    const lastE = useRef(0);
    const handelScroll = (e) => {
        const dis2trigger = 3
        if (e.target !== document) {
            return
        }
        const end = e.target.documentElement.scrollHeight - e.target.documentElement.scrollTop - e.target.documentElement.clientHeight
        // console.log(lastE.current, end, lastE.current > dis2trigger && end <= dis2trigger)
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            console.log("触底触发加载")
            requestNextPage()
        }
        lastE.current = end
    }

    const handeLongClicked = (g_data,x,y) => { 
        console.log("长按事件")
    }
    const infoCallBack = (g_data) => {
        console.log("infoCallBack", g_data.gid, g_data.token)
        openNewTab(`/g/${g_data.gid}/${g_data.token}/`)
     }

    const viewCallBack = (g_data) => { 
        console.log("viewCallBack", g_data.gid, g_data.token)
        openNewTab(`/viewing/${g_data.gid}/${g_data.token}/`)
    }




    const [leftMenuOpen, setLeftMenuOpen] = useState(false)
    const handelLeftMenuClose = () => {
        setLeftMenuOpen(false)
    }
    const handelLeftMenuOpen = () => {
        setLeftMenuOpen(true)
    }

    const handelLeftMenuClick = () => { 
        setLeftMenuOpen(leftMenuOpen => !leftMenuOpen)
    }

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
        },
        {
            onClick: () => {
                openCurrentTab("/downloaded")
            },
            icon: <DownloadIcon />,
            text: "下载"
        },
        {
            onClick: currentHashSort,
            icon: <SortByAlphaIcon />,
            text: "按名称排序"
        }
    ]

    if (
        window.serverSideConfigure.type === "staticApi"
        || window.serverSideConfigure === "Data.db"
        || localStorage.getItem("offline_mode") === "true"
        || currrentUrl() === "/downloaded"
    ) {
        menuItems.push({
            onClick: randomSort,
            icon: <SortIcon />,
            text: "随机排序"
        })
    }


    if (localStorage.getItem("offline_mode") === "true") {
        menuItems.push({
            onClick: () => {
                localStorage.setItem("offline_mode", "false")
                window.location.reload()
            },
            icon: <WifiIcon />,
            text: "在线模式"
        })
    } else {
        menuItems.push({
            onClick: () => {
                localStorage.setItem("offline_mode", "true")
                window.location.reload()

            },
            icon: <WifiOffIcon />,
            text: "离线模式"
        })
    }



    const doSearch = (text) => {
        openCurrentTab(`/search?f_search=${encodeURIComponent(text)}`)
    }




    useEffect(() => {
        window.addEventListener('scroll', handelScroll, true)
        return () => { window.removeEventListener('scroll', handelScroll, true) }
    }, [])

    useEffect(() => {
        initPageFunc()
    }, [locationProps])





    return (
        <React.Fragment >
            <KeyboardController/>
            <TopSearchBar leftButtonClick={handelLeftMenuClick} doSearch={doSearch} />
            <div style={{ width: "100%", height: "60px" }} ></div>

            <LeftMenu open={leftMenuOpen} onClose={handelLeftMenuClose} Items={menuItems}  ></LeftMenu>

            <div className={classes.root}>
                <Grid container spacing={small_matches ? 6 : 1}>
                    {
                        galaryList.map(row => {
                            return (
                                <Grid
                                    style={{ width: "100%" }}
                                    key={row.gid}
                                    item
                                    xl={6} lg={6} md={6} sm={12}>
                                    <Paper className={classes.paper}>
                                        <GallaryCard
                                            longClickCallback={handeLongClicked}
                                            infoCallBack={viewCallBack}
                                            viewCallBack={infoCallBack}
                                            data={row}
                                        />
                                    </Paper>
                                </Grid>
                            )
                        })
                    }
                </Grid>
            </div>

            {
                loadingBar ? <div
                    style={{
                        position: "fixed",
                        bottom: "0px",
                        width: "100%",
                    }}
                ><LinearProgress color='primary' /></div> : null
            }
        </React.Fragment>
    )
}