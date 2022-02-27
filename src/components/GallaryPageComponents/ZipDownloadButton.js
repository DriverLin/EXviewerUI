
import React, { useState } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import JsZip from 'jszip'
import FileSaver from 'file-saver'
import {notifyMessage} from "../utils/PopoverNotifier"
export default function ZipDownloadButton(props) {
    const [stause, setStause] = useState("init")

    const [initOpacity, setInitOpacity] = useState(1)
    const [processingOpacity, setProcessingOpacity] = useState(0)
    const [finishOpacity, setFinishOpacity] = useState(0)

    const [process, setProcess] = useState(0)

    const makeZipAsync = async () => { 
        var new_zip = new JsZip();
        const response = await fetch(`/gallarys/${props.g_data.gid}_${props.g_data.token}/g_data.json`)
        if (!response.ok) { 
            notifyMessage("error","Failed to fetch g_data.json")
            return
        }
        const g_data = await response.json()
        const gallaryname = g_data.title_jpn || g_data.title
        new_zip.file("g_data.json", JSON.stringify(g_data, null, 4))
        let over = 0
        Array.from(Array(Number(g_data.filecount)), (v, k) => k + 1).forEach(async (i) => {
            const pic = await fetch(`/gallarys/${g_data.gid}_${g_data.token}/${(Array(8).join(0) + i).slice(-8)}.jpg`)
            if (!pic.ok) {
                notifyMessage("error", `${(Array(8).join(0) + i).slice(-8)}.jpg 下载失败`)
            } else { 
                const blob = await pic.blob()
                new_zip.file(`${(Array(8).join(0) + i).slice(-8)}.jpg`, blob)
                over++
                setProcess(100 * over / Number(g_data.filecount))
                if (over === Number(g_data.filecount)) {
                    const content = await new_zip.generateAsync({ type: "blob" })
                    FileSaver(content, gallaryname + ".zip")
                    setProcessingOpacity(0)
                    setInitOpacity(0)
                    setTimeout(() => {
                        setStause("success")
                    }, 500);
                    setTimeout(() => {
                        setFinishOpacity(1)
                    }, 600);
                    setTimeout(() => {
                        setFinishOpacity(0)
                    }, 1100);
                    setTimeout(() => {
                        setStause("init")
                    }, 1600);
                    setTimeout(() => {
                        setInitOpacity(1)
                    }, 1700);
                }
            }
        })
    }


    const onClick = async () => {
        setInitOpacity(0)
        setProcessingOpacity(1)
        setTimeout(() => {
            setStause("processing")
        }, 500)
        makeZipAsync()
    }
    const elemMap = {
        "init":
            <IconButton
                name='clickable'
                onClick={onClick}
                sx={{
                    opacity: initOpacity,
                    transition: ".5s",
                    color: "button.iconFunction.main",
                }}
                component="span"
            >
                <IosShareIcon fontSize="large" />
            </IconButton>
        ,
        "processing":
            <div style={{ height: 50.99, width: 50.99, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress
                    size={"29.17px"}
                    thickness={4}
                    sx={{
                        opacity: processingOpacity,
                        transition: ".5s",
                        color: "button.iconFunction.process",
                    }}
                    variant="determinate"
                    value={process}
                />
            </div>
        ,
        "success":
            <IconButton
                sx={{
                    opacity: finishOpacity,
                    transition: ".5s",
                    color: "button.iconFunction.main",
                }}
                aria-label="makeOver" component="span">
                <CheckCircleOutlineIcon fontSize="large" />
            </IconButton>
    }
    return elemMap[stause]
}