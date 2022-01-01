
import React, { useState,} from 'react';
import { IconButton, CircularProgress  } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import JsZip from 'jszip'
import FileSaver from 'file-saver'

export default function ZipDownloadButton(props) {
    const [stause, setStause] = useState("init")

    const [initOpacity, setInitOpacity] = useState(1)
    const [processingOpacity, setProcessingOpacity] = useState(0)
    const [finishOpacity, setFinishOpacity] = useState(0)

    const [process, setProcess] = useState(0)

    const makeZip = () => {
        var new_zip = new JsZip();
        fetch(`/gallarys/${props.g_data.gid}_${props.g_data.token}/g_data.json`)
            .then(res => res.json())
            .then(g_data => {
                const gallaryname = g_data.title_jpn || g_data.title
                console.log("gallaryname", gallaryname)
                console.log("g_data", g_data)
                new_zip.file("g_data.json", JSON.stringify(g_data, null, 4))
                let over = 0
                for (let i = 1; i <= Number(g_data.filecount); i++) {
                    fetch(`/gallarys/${g_data.gid}_${g_data.token}/${(Array(8).join(0) + i).slice(-8)}.jpg`)
                        .then(res => res.blob())
                        .then(blob => {
                            new_zip.file(`${(Array(8).join(0) + i).slice(-8)}.jpg`, blob)
                            over++
                            setProcess(100 * over / Number(g_data.filecount))
                            if (over === Number(g_data.filecount)) {
                                console.log("zip over")
                                new_zip.generateAsync({ type: "blob" }).then(function (content) {
                                    FileSaver(content, gallaryname+".zip");
                                });

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
                        })
                }
            })




    }

    const onClick = () => {
        setInitOpacity(0)
        setProcessingOpacity(1)
        setTimeout(() => {
            setStause("processing")
        }, 500)
        makeZip()
    }


    const elemMap = {
        "init":
            <IconButton
                onClick={onClick}
                sx={{
                    opacity: initOpacity,
                    transition: ".5s",
                    color: "#ffffff",
                    width: 42,
                    height: 42,
                }}
                
                aria-label="share Zip"
                component="span"
            >
                <IosShareIcon fontSize="large" />
            </IconButton>,
        "processing":
            <CircularProgress
                sx={{
                    opacity: processingOpacity,
                    transition: ".5s",
                    width: 42,
                    height: 42,
                    color: "#00796b",
                }}
                variant="determinate"
                value={process}
            />
        ,
        "success":
            <IconButton
                sx={{
                    opacity: finishOpacity,
                    transition: ".5s",
                    color: "#ffffff",
                    width: 42,
                    height: 42,
                }}
                color="primary" aria-label="makeOver" component="span">
                <CheckCircleOutlineIcon fontSize="large" />
            </IconButton>
    }
    return <div style={{ width: 42, height: 42 }}>
        {elemMap[stause]}
    </div>
}