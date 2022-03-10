import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import GallaryPage from "../GallaryPage";
import MainPage from "../MainPage";
import ViewPage from "../ViewPage";

export function SwitchRouter(props) {
    const location = useLocation()
    const history = useRef([`${location.pathname}${location.search}`])//存放历史location序列化字符串
    const [elems, setElems] = useState([]);

    //如果是受控制的路由跳转
    //那么再location变化之前 history就已经完成更新
    //表现为 history[-1] === location.pathname + location.search
    //则pushElement
    //非控制的路由跳转 例如返回 新打开网页
    //如果history[-2] === location序列化 则是返回 直接pop
    //否则就是新网页打开
    //pushElement
    //重复的路由 外部不会触发location事件
    //受控组件执行时候也应当屏蔽与history[-1]相同的跳转动作
    useEffect(() => {
        const locationTarget = `${location.pathname}${location.search}`
        const historyPeek = history.current[history.current.length - 1]
        if (historyPeek !== locationTarget) {
            //非受控 
            if (history.current.length > 1) {
                history.current.pop()
                setElems(elems => elems.slice(0, -1))
            } else {
                history.current.push(locationTarget)
                const appendItem = pathRender(`${location.pathname}`, `${location.search}`)
                setElems([appendItem])
            }
        } else {
            //受控 且为打开新标签   修改当前再另一个函数完成 不会修改主页
            const appendItem = pathRender(`${location.pathname}`, `${location.search}`)
            setElems(elems => [...elems, appendItem]);
        }
    }, [location])

    const openNew = (pathname, search) => {

        console.log("打开新页面", pathname, search)

        const target = `${pathname}${search}`
        if (history.current[history.current.length - 1] === target) {
            console.log("重复的路由")
        } else {
            history.current.push(target)
            window.location.href = `/#${target}`
            console.log("新的路由", target)
        }
    }//open new

    const replaceLast = (arr,item) => {
        if(arr.length === 0){
            return [item]
        }else{
            return [...arr.slice(0, -1),item]
        }
    }


    const openCurrent = (pathname, search) => {//
        console.log("替换当前页面", pathname, search)
        const target = `${pathname}${search}`
        if (history.current[history.current.length - 1] === target) {
            return
        } else {
            history.current.pop()
            history.current.push(target)
            const replaceElem = pathRender(pathname, search)
            setElems(elems => replaceLast(elems,replaceElem));
        }
    }//把当前栈顶的location更新 组件也更新 浏览器地址不更新


    const pathRender = (pathname, search) => {
        if ([
            "/",
            "/search",
            "/watched",
            "/popular",
            "/favorites",
            "/downloaded"
        ].includes(pathname)) {
            return <MainPage key={`${pathname}${search}`} openCurrent={openCurrent} openNew={openNew} location={{ pathname: pathname, search: search }} />
        } else if (pathname.slice(0, 3) === "/g/") {
            return <GallaryPage key={`${pathname}${search}`} openCurrent={openCurrent} openNew={openNew} location={{ pathname: pathname, search: search }} />
        } else if (pathname.slice(0, 9) === "/viewing/") {
            return <ViewPage key={`${pathname}${search}`} openCurrent={openCurrent} openNew={openNew} location={{ pathname: pathname, search: search }} />
        } else {
            return <a>UNKNOW PATH</a>
        }
    }

    //组件内部的useLocation  改成props.location
    //渲染组件时 创建当location副本传递给组件 再将组件放入数组

    useEffect(() => {
        console.log("SwitchRouter: useEffect");
        setElems(elems => [...elems, <MainPage openCurrent={openCurrent} openNew={openNew} location={JSON.parse(JSON.stringify(location))} />]);
    }, [])

    const pushElement = (element) => {
        // setElems(elems => [...elems, <MainPage location={JSON.parse(JSON.stringify(location))} />]);
        openNew("/watched", "")
    }

    const popElement = () => {
        setElems(elems => elems.slice(0, -1));
    }

    useEffect(() => {
        console.log("SwitchRouter: useEffect elems", elems);
    }, [elems])

    return (
        <div>
            {
                elems.map((elem, index) => <div key={index} style={{ display: index === elems.length - 1 ? null : "none" }}  >{elem}</div>)
            }
        </div >
    )
}