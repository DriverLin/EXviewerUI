import React, { useState, useEffect, useRef } from 'react';
import { Button, Paper, Grid, Snackbar, Rating, Alert, useMediaQuery, Card, Typography, Box, ButtonBase } from '@mui/material';
import { styled, makeStyles, withStyles } from '@mui/styles';
import { useLocation, NavLink } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { color } from '@mui/system';

export default function DownloadButton(props) {
    let initButtonText = ""
    
    if (props.g_data.hasOwnProperty('extended') && props.g_data.extended.downloaded === true) {
        const over = props.g_data.extended.process[0]
        const total = props.g_data.extended.process[1]
        if (over === total ) {
            initButtonText = "已下载"
        } else { 
            initButtonText = `${total-over}项未完成`
        }
    } else {
        initButtonText = "下载"
    }


    const [stause, setStause] = useState("init")
    const [downloadProgress, _setDownloadProgress] = useState([0, 0, 999])
    const downloadProgressRef = useRef(0)
    const setDownloadProgress = (value) => {
        downloadProgressRef.current = value
        _setDownloadProgress(value)
    }

    const [textOpacity, setTextOpacity] = useState(1)
    const [progressOpacity, setProgressOpacity] = useState(1)

    const switchToProcessing = () => {
        setTextOpacity(0)
        setProgressOpacity(1)
        setTimeout(() => {
            setStause("processing")
        }, 500)
    }

    const switchToText = (stause) => {
        setProgressOpacity(0)
        setTextOpacity(0)
        setTimeout(() => {
            setStause(stause)
        }, 500)
        setTimeout(() => {
            setTextOpacity(1)
        }, 600)
    }


    const lock = useRef(false)



    const onClick = () => {
        if (window.serverSideConfigure.type !== "full" || localStorage.getItem("offline_mode") === "true") return
        //只有full and not offline mode才能下载


        if (lock.current) return
        lock.current = true
        setDownloadProgress([0, 0, 999])
        const wssOrWS = window.location.protocol === "https:" ? "wss:" : "ws:"
        let wsUrl = `${wssOrWS}//${window.location.host}/ws`
        if (window.location.host.includes(":3000")) {
            console.log("dev")
            //球球别部署在3000 球球了
            wsUrl = wsUrl.replace(":3000", ":8080")
        }

        switchToProcessing()
        const gid_token = `${props.g_data.gid}_${props.g_data.token}`
        fetch(`/download/${gid_token}`)
            .then(res => {
                try { 
                    console.log("res", res.json())
                    const ws = new WebSocket(wsUrl)
                    ws.onmessage = (e) => {
                        try {
                            const recvData = JSON.parse(e.data)
                            if (`${recvData.gid}_${recvData.token}` === gid_token) {
                                if (recvData.tag === "notify") {
                                    if (recvData.msg === "downloadSuccess") {
                                        switchToText("success")
                                        ws.close()

                                    } else if (recvData.msg === "downloadFailed") {
                                        switchToText("failed")
                                        lock.current = false
                                        ws.close()

                                    }
                                } else if (recvData.tag === "reportProcess") {
                                    const process = recvData.msg
                                    const prevSuccss = downloadProgressRef.current[0]
                                    const prevFailed = downloadProgressRef.current[1]
                                    if (prevSuccss <= process[0] && prevFailed <= process[1]) {
                                        setDownloadProgress(process)
                                    } else {
                                        console.log("olderprocess", process, prevSuccss, prevFailed)
                                    }
                                } else if (recvData.tag === "error") {
                                    switchToText("failed")
                                    lock.current = false
                                    ws.close()
                                }
                            } else {
                                console.log("not match")
                            }
                        } catch (err) {
                            console.log("err", err)
                            ws.close()
                            switchToText("failed")
                            lock.current = false
                        }
                    }
                }catch(err) {
                    console.log("err", err)
                    switchToText("failed")
                    lock.current = false
                }
            })
            .catch(err => {
                console.log(err)
                switchToText("failed")
                lock.current = false
            })
    }




    const eleMap = {
        "init":
            <div style={{ opacity: textOpacity, transition: .5 }}>
                {initButtonText}
            </div>,
        "processing":
            <LinearProgress
                sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 1,
                    "& .MuiLinearProgress-bar1Buffer": {
                        backgroundColor: "#00796b"
                    },
                    "& .MuiLinearProgress-bar2Buffer": {
                        backgroundColor: "#BDBDBD"
                    },
                    "& .MuiLinearProgress-dashed": {
                        display: "none"
                    },
                    backgroundColor: "#4a4a4a",
                    transition: ".5s",
                    opacity: progressOpacity,
                }}
                variant="buffer"
                value={100 * downloadProgress[0] / downloadProgress[2]}
                valueBuffer={100 * (downloadProgress[0] + downloadProgress[1]) / downloadProgress[2]}
            />,

        "success":
            <div style={{ display: "flex", opacity: textOpacity, transition: .5 }}>
                成功
                <CheckCircleOutlineIcon />
            </div>,
        "failed":
            <div style={{ display: "flex", opacity: textOpacity, transition: .5 }}>
                {
                    downloadProgress[1] === 0 ? "失败" : downloadProgress[1] + "项下载失败"

                }
                <ErrorOutlineIcon />
            </div>,
    }

    return <Button
        sx={{
            width: "100%",
            height: 42,
            backgroundColor: "#4a4a4a",
            padding: "0px",
            overflow: "hidden",
            "&:hover": {
                backgroundColor: "#646464",
            }
        }}
        variant="contained"
        onClick={onClick}
    >
        {
            eleMap[stause]
        }
    </Button>
}
