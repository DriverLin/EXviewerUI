import { Button, LinearProgress } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { addDownload, addFavo, useSyncState } from '../utils/GlobalActionHandeler';
import { useSettingBind } from '../utils/Settings';

export default function DownloadButton(props) {
    const total = Number(props.g_data.filecount)
    const addFavoWhenDownload = useSettingBind("下载时添加收藏", false)
    const favoIndex = useSettingBind("收藏夹", 9)
    const wsSyncState = useSyncState()

    const calcText = (num) => {
        if (num === -2) {
            return '下载'
        } if (num === -1) {
            return "队列中"
        }
        if (num === total) {
            return "已下载"
        }
        return `${total - num}项未完成`
    }

    const initState = [false, -1, -2]
    if (props.g_data.hasOwnProperty('extended')) {
        const over = props.g_data.extended.download
        const favo = props.g_data.extended.favo
        initState[1] = favo
        initState[2] = over
    }

    const [trueState, setTrueState] = useState(initState)
    

    const downloading = useMemo(() => trueState[0], [trueState])
    const processBarValue = useMemo(() => 100 * (trueState[2] > 0 ? trueState[2] : 0) / total, [trueState])


    const [showText , setShowText] = useState(calcText(initState[2]))
    useEffect(()=>{
        setShowText(calcText(trueState[2]))
    },[trueState])
    // const [showText, setShowText] = useState(calcText(initState[2]))

    const [textOpacity, setTextOpacity] = useState(1)
    const [progressOpacity, setProgressOpacity] = useState(1)

    useEffect(() => {
        if (Object.keys(wsSyncState).length === 0) return
        const testState = wsSyncState[props.g_data.gid]
        // console.log("testState", testState)
        if (testState) {
            setTrueState(testState)
        } else {
            setTrueState([false, -1, -2])
        }
    }, [wsSyncState])


    const onClick = () => {
        if (window.serverSideConfigure.type !== "full" || localStorage.getItem("offline_mode") === "true") return
        if (trueState[0]) return // 已经在下载中
        setShowText("已添加")
        if (addFavoWhenDownload) {
            addFavo(props.g_data.gid, props.g_data.token, favoIndex)
        }
        props.enableDelete()
        addDownload(props.g_data.gid, props.g_data.token)
    }


    return <Button
        sx={{
            width: "100%",
            height: 42,
            padding: "0px",
            overflow: "hidden",
            backgroundColor: "button.readAndDownload.main",
            "&:hover": {
                backgroundColor: "button.readAndDownload.hover",
            },
            color: "button.readAndDownload.text",
        }}
        name='clickable'
        variant="contained"
        onClick={onClick}
    >
        {
            downloading ?
                <LinearProgress
                    sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 1,
                        "& .MuiLinearProgress-bar1Buffer": {
                            backgroundColor: "button.readAndDownload.process",
                        },
                        "& .MuiLinearProgress-bar2Buffer": {
                            backgroundColor: "#button.readAndDownload.buffer"
                        },
                        "& .MuiLinearProgress-dashed": {
                            display: "none"
                        },
                        backgroundColor: "button.readAndDownload.main",
                        transition: ".5s",
                        opacity: 1,
                    }}
                    variant="buffer"
                    value={processBarValue}
                    valueBuffer={0}
                /> :

                <div style={{ opacity: 1, transition: .5 }}>
                    {showText}
                </div>
        }
    </Button>
}
