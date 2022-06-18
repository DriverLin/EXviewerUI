//通过添加已下载的zip文件 存储到服务器的下载列表
//如果是gid_token.zip 格式 可自动识别填写 否则提示手动填写gid token
//可以有预览画面

import { Button, CircularProgress, Grid, Skeleton, Switch, TextField, useMediaQuery } from "@mui/material"
import { makeStyles } from '@mui/styles';
import { useEffect, useMemo, useRef, useState } from "react"
import JsZip from 'jszip';
import { notifyMessage } from "../utils/PopoverNotifier";
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const extNames = ["jpg", "JPG", "png", "PNG", "gif", "GIF"]

const DelayLoadImage = ({ src }) => {
    return src ?
        <div
            style={{
                width: "100%",
                height: "0",
                paddingBottom: "139%",
                overflow: "hidden",
                borderRadius: 5,
            }}
        >
            <img
                src={src}
                style={{
                    width: "100%",
                    borderRadius: 5
                }}
            />
        </div>
        :
        <Skeleton
            name='clickable'
            variant="rectangular"
            style={{
                width: "100%",
                height: "0",
                paddingBottom: "139%",
                overflow: "hidden",
                borderRadius: 5
            }} />
}


function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                {
                    Math.round(props.value,) === 100 ?
                        <Typography variant="body2" color="text.secondary">{`完成`}</Typography>
                        :
                        <Typography variant="body2" color="text.secondary">{`${Math.round(props.value,)}%`}</Typography>
                }
            </Box>
        </Box>
    );
}


export default function UploadZip(props) {
    const small_matches = useMediaQuery('(min-width:560px)');
    const break_matches = useMediaQuery('(min-width:800px)');
    const borderWidth = useMemo(() => {
        return small_matches ? 24 : 12
    }, [small_matches])
    const useStyles = makeStyles((theme) => (
        {
            borderCard: {
                margin: "0 auto",
                marginTop: 40,
                marginBottom: 40,
                width: 754,
                borderRadius: 20,
                color: theme.palette.background.mainCard,
                boxShadow: theme.palette.page.shadow,
                overflow: "hidden"
            },
            matches_borderCard: {
                margin: "0 auto",
                marginBottom: 0,
                color: theme.palette.background.mainCard,
                overflow: "hidden"
            },
            elemContainer: {
                width: `calc(100% - ${borderWidth * 2}px)`,
                marginLeft: borderWidth,
                marginTop: borderWidth
            }
        }
    ))

    const classes = useStyles();

    const [fileName, setFileName] = useState("")
    const [prevBlobUrls, setPrevBlobUrls] = useState({})
    const [prevBlobCount, setPrevBlobCount] = useState(0)
    const [galleryUrl, setGalleryUrl] = useState('')
    const [g_data, setG_data] = useState(null)
    const [canUpload, setCanUpload] = useState(false)
    const [uploadingProgress, setUploadingProgress] = useState(-1)
    const [speedText, setSpeedText] = useState("0mb/S")
    const [showPreview, setShowPreview] = useState(false)
    const zip = useRef(null)
    const makePreviewsLock = useRef(false)


    const makePreviews = () => {
        if (makePreviewsLock.current) return
        if (zip.current === null) return
        makePreviewsLock.current = true
        const imgs = Object.keys(zip.current.files).filter(
            x => {
                const splitted = x.split(".")
                return extNames.includes(splitted[splitted.length - 1])
            }
        )
        imgs.sort()

        imgs.map(async (imgName, index) => {
            const imgBlob = await zip.current.files[imgName].async("blob")
            const url = URL.createObjectURL(imgBlob)
            if (makePreviewsLock.current === false) return//锁被打开 则放弃未完成的
            setPrevBlobUrls((old) => { return { ...old, [index]: url } })
        })
    }
    useEffect(() => {
        if (showPreview) {
            makePreviews()
        }
    }, [showPreview])

    const clearPrevState = () => {
        setFileName("")
        setPrevBlobUrls({})
        setPrevBlobCount(0)
        setGalleryUrl("")
        setG_data(null)
        setCanUpload(false)
        setUploadingProgress(-1)
        setSpeedText("0mb/s")
        zip.current = null
        makePreviewsLock.current = false
    }

    const onFileUpload = async (e) => {
        const file = e.target.files[0]
        if (file === undefined) return
        clearPrevState()
        setFileName(file.name)
        try {
            zip.current = await (new JsZip()).loadAsync(file)
        } catch (err) {
            console.log(err)
            notifyMessage("error", "损坏的zip文件")
            return
        }
        const splittedName = file.name.split(".")[0].split("_")
        if (splittedName.length === 2) {
            setGalleryUrl(`https://exhentai.org/g/${splittedName[0]}/${splittedName[1]}/`)
        }
        setPrevBlobUrls({})

        const imgs = Object.keys(zip.current.files).filter(x => extNames.includes(x.split(".")[1]))
        setPrevBlobCount(imgs.length)
        if (showPreview) {
            makePreviews()
        }
    }

    const checkG_data = async () => {
        if (galleryUrl.split("/").length !== 7) {
            notifyMessage("error", "请输入正确的URL\nhttps://exhentai.org/g/[GID]/[TOKEN]/")
            return
        }
        // const g_data_response = await fetch(`/G_dataOfficial/${galleryUrl.split("/")[4]}/${galleryUrl.split("/")[5]}`)
        const g_data_response = await fetch(`/Gallery/${galleryUrl.split("/")[4]}_${galleryUrl.split("/")[5]}/g_data.json`)
        if (g_data_response.ok) {
            const g_data_result = await g_data_response.json()
            setG_data(g_data_result)
            console.log(JSON.stringify(g_data_result, null, 4))
            if (Number(g_data_result.filecount) !== prevBlobCount) {
                notifyMessage("error", "文件数量不匹配")
                setCanUpload(false)
                return
            } else {
                setCanUpload(true)
                notifyMessage("success", "文件数量已匹配")
            }
        } else {
            const text = await g_data_response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", info.detail)
            } catch (error) {
                notifyMessage("error", text)
            }
        }
    }
    const startUpload = () => {
        setCanUpload(false)
        setUploadingProgress(0)
        const wssOrWS = window.location.protocol === "https:" ? "wss:" : "ws:"
        let wsUrl = `${wssOrWS}//${window.location.host}/`
        if (window.location.host.includes("3000")) {
            wsUrl = wsUrl.replace("3000", "7964")
        }
        const ws = new WebSocket(wsUrl+"uploadZip")
        ws.binaryType = "arraybuffer";
        ws.onopen = () => {
            const reader = new FileReader()
            const file = document.getElementById("zipUploadInputForm").files[0]
            reader.onload = (e) => {
                ws.send(`${g_data.gid}_${g_data.token}`)
                const rawData = e.target.result;
                const totalLength = rawData.byteLength
                ws.send(rawData)
                let lastLeftBytes = totalLength;
                const interval = setInterval(() => {
                    setUploadingProgress(100 - 100 * ws.bufferedAmount / totalLength)
                    console.log(100 - 100 * ws.bufferedAmount / totalLength)
                    const transferredBytes = lastLeftBytes - ws.bufferedAmount
                    lastLeftBytes = ws.bufferedAmount
                    const speed = transferredBytes / 500000 // "mb/s"
                    setSpeedText(speed.toFixed(2) + "mb/s")
                    if (ws.bufferedAmount === 0) {
                        clearInterval(interval)
                    }
                }, 500)
                ws.close()
            }
            reader.readAsArrayBuffer(file)
        }
    }



    return <div className={break_matches ? classes.borderCard : classes.matches_borderCard} >
        <div className={classes.elemContainer}>
            <Grid
                container
                direction="row"
                justifyContent="flex-start"
                alignItems="flex-start"
            >
                <Grid item xs={6}>
                    <input
                        accept="application/zip,application/x-zip,application/x-zip-compressed"
                        id="zipUploadInputForm"
                        type="file"
                        onChange={(e) => onFileUpload(e)}
                        style={{ display: "none" }}
                    />
                    <label htmlFor="zipUploadInputForm">
                        <Button variant="contained" component="span">
                            选择文件
                        </Button>
                    </label>
                </Grid>
                <Grid item xs={6}>
                    <a>预览</a>
                    <Switch
                        checked={showPreview}
                        onChange={() => { setShowPreview(prev => !prev) }}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                </Grid>
            </Grid>
        </div>
        {
            fileName === "" ? null :
                <div className={classes.elemContainer}>
                    <a>{fileName}</a>
                    {prevBlobCount === 0 ? <CircularProgress
                        size={17}
                    /> : null}
                </div>
        }
        {
            prevBlobCount === 0 ? null :
                <div className={classes.elemContainer}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="flex-start"
                        spacing={borderWidth + "px"}
                        sx={{ width: `calc(100% + ${borderWidth}px)` }}
                    >
                        {/* <Grid item xs={4} >
                            <TextField label="GID" variant="standard" value={gid} onChange={(e) => setGid(e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField label="TOKEN" variant="standard" value={token} onChange={(e) => setToken(e.target.value)} />
                        </Grid> */}

                        <Grid item xs={6} md={8} >
                            <TextField sx={{ width: "100%" }} label="画廊链接" variant="standard" value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} />
                        </Grid>
                        <Grid item xs={3} md={2}>
                            <Button variant="contained" style={{ marginTop: 12 }} onClick={checkG_data}>检查</Button>
                        </Grid>
                        <Grid item xs={3} md={2}>
                            <Button variant="contained" style={{ marginTop: 12 }} disabled={!canUpload} onClick={startUpload}>上传</Button>
                        </Grid>
                    </Grid>
                </div>
        }

        {
            uploadingProgress === -1 ? null :
                <div className={classes.elemContainer}>
                    <LinearProgressWithLabel value={uploadingProgress} />
                    <a>{speedText}</a>
                </div>
        }
        {
            g_data === null ? null :
                <div className={classes.elemContainer}>
                    <pre style={{ fontFamily: "Roboto,Helvetica,Arial,sans-serif" }}   >
                        {JSON.stringify(g_data, null, 4)}
                    </pre>
                </div>
        }
        {
            prevBlobCount === 0 || showPreview === false ? null :
                <div className={classes.elemContainer}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="flex-start"
                        spacing={borderWidth + "px"}
                        sx={{ width: `calc(100% + ${borderWidth}px)` }}
                    >
                        {
                            Array(prevBlobCount).fill(null).map((item, index) => {
                                return (
                                    <Grid key={index} item xs={break_matches ? 3 : 4} >
                                        <DelayLoadImage src={prevBlobUrls[index]} />
                                    </Grid>
                                )
                            })
                        }
                    </Grid>
                </div>
        }
        <div className={classes.elemContainer} />
    </div>
}