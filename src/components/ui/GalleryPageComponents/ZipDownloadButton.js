
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import { CircularProgress, IconButton } from '@mui/material';
import FileSaver from 'file-saver';
import JsZip from 'jszip';
import React, { useState } from 'react';
import { fetchG_Data, getGalleryImgUrl } from '../../api/serverApi';
import { notifyMessage } from '../../utils/PopoverNotifier';


/**
 * 下载ZIP
 * @param {object} props
 * @param {Number} props.gid
 * @param {String} props.token 
 * @returns 
 */
export default function ZipDownloadButton(props) {
    const [state, setState] = useState("init")
    const [initOpacity, setInitOpacity] = useState(1)
    const [processingOpacity, setProcessingOpacity] = useState(0)
    const [finishOpacity, setFinishOpacity] = useState(0)
    const [downloadProcess, setDownloadProcess] = useState(0)
    const [noError, setNoError] = useState(true)

    const makeZipAsync = async () => {
        var new_zip = new JsZip();
        const [g_data,error] = await fetchG_Data(props.gid, props.token, false)
        if (error) {
            notifyMessage("error", "Failed to fetch g_data.json")
            setTimeout(() => { setNoError(false) }, 450);
            setTimeout(() => { setState("init") }, 500);
            setTimeout(() => { setInitOpacity(1) }, 600);
            return
        }
        const galleryName = g_data.title_jpn || g_data.title
        new_zip.file("g_data.json", JSON.stringify(g_data, null, 4))
        let over = 0
        const jobs = Array.from(Array(Number(g_data.filecount)), (v, k) => k + 1).map(async (i) => {
            const pic = await fetch(getGalleryImgUrl(props.gid, props.token, i))
            if (!pic.ok) {
                notifyMessage("error", `Failed to fetch ${(Array(8).join(0) + i).slice(-8)}.jpg`)
            } else {
                const blob = await pic.blob()
                new_zip.file(`${(Array(8).join(0) + i).slice(-8)}.jpg`, blob)
                over++
                setDownloadProcess(100 * over / Number(g_data.filecount))
            }
        })
        await Promise.all(jobs)
        setProcessingOpacity(0)
        setInitOpacity(0)
        if (over === Number(g_data.filecount)) {
            new_zip.generateAsync({ type: "blob" }).then(function (content) {
                FileSaver(content, galleryName + ".zip");
            });
            setNoError(true)
            setTimeout(() => { setState("success") }, 500);
            setTimeout(() => { setFinishOpacity(1) }, 600);
            setTimeout(() => { setFinishOpacity(0) }, 1100);
            setTimeout(() => { setState("init") }, 1600);
            setTimeout(() => { setInitOpacity(1) }, 1700);
        } else {
            setNoError(false)
            setTimeout(() => { setState("init") }, 500);
            setTimeout(() => { setInitOpacity(1) }, 600);
        }
    }

    const onClick = async () => {
        setInitOpacity(0)
        setProcessingOpacity(1)
        setTimeout(() => { setState("processing") }, 500)
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
                {
                    noError ?
                        <IosShareIcon fontSize="large" />
                        :
                        <ErrorOutlineIcon fontSize="large" />

                }
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
                    value={downloadProcess}
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
    return elemMap[state]
}