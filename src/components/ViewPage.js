import React, { useState, useEffect, useRef } from 'react';

import RevSlider from './ViewPageComponents/RevSlider';
import ViewSettingPanel from './ViewPageComponents/ViewSettingPanel';
import MultPageSwiper from './ViewPageComponents/MultPageSwiper';
import { useLocation } from "react-router-dom";
import { useSettingBind } from './Settings';
import { notifyMessage } from './utils/PopoverNotifier';



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
        if (pageNumRef.current === value) return
        pageNumRef.current = value
        _setPageNum(value);
        localStorage.setItem(`/viewing/${gid}/${token}/`, value);
        if (value === pageCount) {
            localStorage.removeItem(`/viewing/${gid}/${token}/`);
        }
    }


    //考虑到服务器压力  以及阅读速度
    //不需要按照是否双页进行双倍预加载
    
    const prevRange = 4
    const nextRange = useSettingBind("图片预加载",7)

    
    useEffect(() => {
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
        const jmpNum = horizontalView ? 2 : 1
        const postion = switchDirection ? -1 : 1  
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

    const horizontalView = useSettingBind("横屏模式", false);
    const switchPagination = useSettingBind("分页模式", false);
    const switchDirection = useSettingBind("阅读方向", true);

    const onViewSettingPanelClose = () => {
        setSettingPanelOpen(false)
    }
    const onViewSettingPanelOpen = () => { setSettingPanelOpen(true) }


    const init = async () => { 
        const response = await fetch(`/gallarys/${gid}_${token}/g_data.json`)
        if (response.ok) {
            const data = await response.json()
            document.title = data.title_jpn || data.title
            const tmpUrl = []
            for (let i = 1; i <= Number(data.filecount); i++) {
                tmpUrl.push(`/gallarys/${gid}_${token}/${(Array(8).join(0) + i).slice(-8)}.jpg`)
            }
            setUrls(tmpUrl)
            setPageCount(Number(data.filecount))
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



    useEffect(() => {
        init()
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
                            key={horizontalView}//切换横屏模式  就重新渲染 避免了页数切换的BUG
                            value={pageNum}
                            setValue={setPageNum}
                            reverse={switchDirection}
                            double={horizontalView}
                            headsingle={switchPagination}
                            urls={urls}
                        />
                    }
                </div>
                <RevSlider
                    open={sliderOpen}
                    onClose={onSliderClose}
                    value={pageNum}
                    setValue={setPageNum}
                    reverse={switchDirection}
                    max={pageCount}
                />
            </div>
    )
}

