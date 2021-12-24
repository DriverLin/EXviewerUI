import React, { useState, useEffect, useRef } from 'react';

import LoadingAnime from './LoadingAnime';
import RevSlider from './RevSlider';
import ViewSettingPanel from './ViewSettingPanel';
import MultPageSwiper from './MultPageSwiper';
import { useLocation, NavLink } from "react-router-dom";



export default function ViewPage(props) {
    const location = useLocation();
    const gid = location.pathname.split("/")[2]
    const token = location.pathname.split("/")[3]
    const [pageCount, setPageCount] = useState(0);
    const [pageNum, _setPageNum] = useState(Number(localStorage.getItem(`/viewing/${gid}/${token}/`)) || 1);
    const setPageNum = (value) => {
        console.log("setPageNum", value);
        _setPageNum(value);
        localStorage.setItem(`/viewing/${gid}/${token}/`, value);
        if (value == pageCount) {
            localStorage.removeItem(`/viewing/${gid}/${token}/`);
        }
    }



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

    const [urls, setUrls] = useState([])

    const [viewSettings, setViewSettings] = useState(
        JSON.parse(localStorage.getItem("global_viewingSettings")) || {
            "横屏模式": false,
            "切换分页": false,
            "切换方向": false
        }
    )

    const onViewSettingPanelClose = () => {
        setSettingPanelOpen(false)
        const setting = JSON.parse(localStorage.getItem("global_viewingSettings")) || {
            "横屏模式": false,
            "切换分页": false,
            "切换方向": false
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

