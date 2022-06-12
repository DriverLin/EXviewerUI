import { Slide } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import AppSetting from "../ui/AppSetting";
import GalleryPage from "../ui/GalleryPage";
import MainPage from "../ui/MainPage";
import ViewPage from "../ui/ViewPage";
import { getSetting } from "./SettingHooks";
const replaceLast = (arr, item) => {
    if (arr.length === 0) {
        return [item]
    } else {
        return [...arr.slice(0, -1), item]
    }
}




/**
 *如果是受控制的路由跳转
 * 那么再location变化之前 history就已经完成更新
 * 表现为 history[-1] === location.pathname + location.search
 * 则pushElement
 * 非控制的路由跳转 例如返回 新打开网页
 * 如果history[-2] === location序列化 则是返回 直接pop
 * 否则就是新网页打开
 * pushElement
 * 重复的路由 外部不会触发location事件
 * 受控组件执行时候也应当屏蔽与history[-1]相同的跳转动作
 * @param {*} props 
 * @returns 
 */
export function SwitchRouter(props) {
    const location = useLocation()
    const history = useRef([])//存放历史location序列化字符串
    const [elements, setElements] = useState([]);//history与elems一定是全映射的


    useEffect(() => {
        const pathname = decodeURIComponent(location.pathname)
        const search = decodeURIComponent(location.search)
        const locationTarget = `${pathname}${search}`
        const historyPeek = history.current[history.current.length - 1]
        if (historyPeek !== locationTarget) {//非受控 
            if (history.current.length > 1 && history.current[history.current.length - 2] === locationTarget) {
                history.current.pop()
                setElements(elements => elements.slice(0, -1))
            } else {
                history.current.push(locationTarget)
                const appendItem = pathRender(`${pathname}`, `${search}`)
                setElements(elements => [...elements, appendItem])
            }
        } else {
            //受控 添加到尾部
            const appendItem = pathRender(`${pathname}`, `${search}`)
            setElements(elements => [...elements, appendItem]);
        }
    }, [location])

    const openNew = (pathname, search) => {
        console.log("打开新页面", pathname, search)
        const target = `${pathname}${search}`
        if (history.current[history.current.length - 1] === target) {
            console.log("重复的路由")
            return
        } else {
            history.current.push(target)
            window.location.href = `/#${target}`
            console.log("新的路由", target)
            return
        }
    };//open new

    const openCurrent = (pathname, search) => {//
        console.log("替换当前页面", pathname, search)
        const replaceElem = pathRender(pathname, search)
        setElements(elements => replaceLast(elements, replaceElem));
    };//把当前栈顶的location更新 组件也更新 浏览器地址不更新


    const replaceCurrentPathnames = new Set(['/', '/search', '/watched', '/popular', '/favorites', '/downloaded'])
    const openURL = (pathname, search) => {
        if (replaceCurrentPathnames.has(pathname)) {
            openCurrent(pathname, search)
        } else {
            openNew(pathname, search)
        }
    }
    const openRead = (gid, token) => {
        openURL(`/viewing/${gid}/${token}`, '')

    }
    const openGallery = (gid, token) => {
        openURL(`/g/${gid}/${token}`, '')
    }

    const openTagSearch = (row, tag) => {
        const tagText = `${row}:"${tag}$"`
        openNew("/search", `?f_search=${tagText}`)
    }

    const initSearch = (pathname, search) => {
        return decodeURIComponent(search).replace("&f_search=", "").replace("?f_search=", "")
    }
    const downloadPage = (pathname, search) => { return pathname === '/downloaded' }
    const apiURL = (pathname, search) => {
        console.log("apiURL", pathname, search)

        const f_search_url = search.slice(0, 1) === "?" ?
            `/list/${search}${getSetting("搜索本地画廊", false) ? "&search_and_merge_local=true" : ""}`
            :
            `/list/?${search}${getSetting("搜索本地画廊", false) ? "&search_and_merge_local=true" : ""}`

        const urlMap = {
            "/": "/list/?1=1",
            "/search": f_search_url,
            "/watched": "/list/watched?1=1",
            "/popular": "/list/popular?1=1",
            "/favorites": "/list/favorites.php?1=1",
            "/downloaded": "/api/data"
        }
        return urlMap[pathname]
    }


    const pathRender = (pathname, search) => {
        if ([
            "/",
            "/search",
            "/watched",
            "/popular",
            "/favorites",
            "/downloaded",
        ].includes(pathname)) {
            return <MainPage
                key={`${pathname}___${search}`}
                initSearch={initSearch(pathname, search)}
                downloadPage={downloadPage(pathname, search)}
                apiURL={apiURL(pathname, search)}
                openRead={openRead}
                openGallery={openGallery}
                openURL={openURL}
            />
        } else if (pathname.slice(0, 3) === "/g/") {
            return <GalleryPage
                key={pathname}
                gid={Number(pathname.split("/")[2])}
                token={pathname.split("/")[3]}
                openRead={openRead}
                onTagClick={openTagSearch}
            />
        } else if (pathname.slice(0, 9) === "/viewing/") {
            return <ViewPage
                key={pathname}
                gid={Number(pathname.split("/")[2])}
                token={pathname.split("/")[3]}
            />
        } else if (pathname.slice(0, 8) === "/setting") {
            return <AppSetting />
        } else {
            return <a>UNKNOWN PATH</a>
        }
    }

    //组件内部的useLocation  改成props.location
    //渲染组件时 创建当location副本传递给组件 再将组件放入数组
    useEffect(() => {
        console.log("SwitchRouter: useEffect elements", elements);
    }, [elements])

    return (
        <div>
            {
                elements.map((elem, index) => (
                    <Slide key={index} in={true} appear={index !== 0} direction="left"  >
                        <div

                            style={{ display: index === elements.length - 1 ? null : "none" }}
                        >
                            {elem}
                        </div>
                    </Slide>
                )
                )
            }
        </div >
    )
}