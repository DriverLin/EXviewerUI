import React, { useState, useEffect, useRef } from 'react';

import RevSlider from './ViewPageComponents/RevSlider';
import ViewSettingPanel from './ViewPageComponents/ViewSettingPanel';
import MultPageSwiper from './ViewPageComponents/MultPageSwiper';
import { useLocation } from "react-router-dom";



export default function ViewPage() {

    const [urls, setUrls] = useState([])


    const location = useLocation();
    const gid = location.pathname.split("/")[2]
    const token = location.pathname.split("/")[3]
    
    const pageCountRef = useRef(0)
    const [pageCount, _setPageCount] = useState(0);
    const setPageCount = (value) => {
        pageCountRef.current = value
        _setPageCount(value)
    }


    const pageNumRef = useRef(Number(localStorage.getItem(`/viewing/${gid}/${token}/`)) || 1)
    const [pageNum, _setPageNum] = useState(Number(localStorage.getItem(`/viewing/${gid}/${token}/`)) || 1);


    const setPageNum = (value) => {
        pageNumRef.current = value
        _setPageNum(value);
        localStorage.setItem(`/viewing/${gid}/${token}/`, value);
        if (value === pageCount) {
            localStorage.removeItem(`/viewing/${gid}/${token}/`);
        }
    }


    //考虑到服务器压力  以及阅读速度
    //不需要按照是否双页进行双倍预加载
    useEffect(() => {
        const prevRange = 4
        const nextRange = 6
        const start = pageNumRef.current - prevRange > 0 ? pageNumRef.current - prevRange : 1
        const end = pageNumRef.current + nextRange > pageCountRef.current ? pageCountRef.current : pageNumRef.current + nextRange
        for (let i = start; i <= end; i++) { 
            let img = new Image();
            img.onload = () => { 
                img = null
            }
            img.src = urls[i - 1]
        }
    }, [pageNum])

    const [sliderOpen, setSliderOpen] = useState(false)
    const onSliderClose = () => {
        setSliderOpen(false)
    }

    const [settingPanelOpen, setSettingPanelOpen] = useState(false)


    const handelTap = (event) => {
        const jmpNum = viewSettings["横屏模式"] ? 2 : 1
        const postion = viewSettings['切换方向'] ? -1 : 1  
        if (event.pageX / document.body.clientWidth > 0.7) {
            setPageNum(pageNum + postion * jmpNum)
        } else if (event.pageX / document.body.clientWidth < 0.3) {
            setPageNum(pageNum - postion * jmpNum)
        } else {
            if (event.pageY / document.body.clientHeight < 0.5) {
                setSettingPanelOpen(settingPanelOpen => !settingPanelOpen)
            }
            else {
                setSliderOpen(sliderOpen => !sliderOpen)
            }
        }
    }


    const [viewSettings, setViewSettings] = useState(
        JSON.parse(localStorage.getItem("global_viewingSettings")) || {
            "横屏模式": false,
            "切换分页": false,
            "切换方向": true
        }
    )

    const onViewSettingPanelClose = () => {
        setSettingPanelOpen(false)
        const setting = JSON.parse(localStorage.getItem("global_viewingSettings")) || {
            "横屏模式": false,
            "切换分页": false,
            "切换方向": true
        }
        setViewSettings(setting)
    }
    const onViewSettingPanelOpen = () => { setSettingPanelOpen(true) }


    useEffect(() => {
        fetch(`/gallarys/${gid}_${token}/g_data.json`).then(res => res.json()).then(res => {
            document.title = res.title_jpn || res.title
            const tmpUrl = []
            for (let i = 1; i <= Number(res.filecount); i++) {
                tmpUrl.push(`/gallarys/${gid}_${token}/${(Array(8).join(0) + i).slice(-8)}.jpg`)
            }
            setUrls(tmpUrl)
            setPageCount(Number(res.filecount))
        }).catch(err => {
            console.log("err", err)
        })
    }, [])

    return (

        pageCount === 0 ?
            // <LoadingAnime />
            null
            :
            <div >
                <ViewSettingPanel
                    open={settingPanelOpen}
                    onClose={onViewSettingPanelClose}
                    onOpen={onViewSettingPanelOpen}
                />
                <div style={{ height: '100vh', width: '100vw', }} onClick={handelTap}>
                    {
                        <MultPageSwiper
                            value={pageNum}
                            setValue={setPageNum}
                            reverse={viewSettings["切换方向"]}
                            double={viewSettings['横屏模式']}
                            headsingle={viewSettings['切换分页']}
                            urls={urls}
                        />
                    }
                </div>
                <RevSlider
                    open={sliderOpen}
                    onClose={onSliderClose}
                    value={pageNum}
                    setValue={setPageNum}
                    reverse={viewSettings["切换方向"]}
                    max={pageCount}
                />
            </div>
    )
}

