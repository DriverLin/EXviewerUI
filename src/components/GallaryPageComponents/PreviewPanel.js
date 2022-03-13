import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { Button, Grid } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';


function PreviewLoadingImg(props) {
    const [stause, setStause] = useState('loading')//loading error finished
    let img = new Image()
    img.onload = () => {
        setStause('finished')
        img = null
    }
    img.onerror = () => {
        setStause('error')
    }
    img.src = props.src

    const elemMap = {
        'loading':
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
        ,
        'error':
            <div
                name='clickable'
                style={{
                    height: "auto",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }} >
                <BrokenImageIcon />
            </div>,
        'finished':
            <div
                name='clickable'
                style={{
                    width: "100%",
                    height: "0",
                    paddingBottom: "139%",
                    overflow: "hidden",
                    borderRadius: 5,
                }}
            >
                <img src={props.src} style={{ width: "100%", borderRadius: 5 }} alt="prev" />
            </div>
    }
    return elemMap[stause]
}


export default function PreviewPanel(props) {
    const [previewButtonShow, setPreviewButtonShow] = useState(props.previews.length !== 0)
    const [previewShows, setPreviewShows] = useState(props.previews.slice(0, 20))
    const currentShowPreviewLength = useRef(20)
    const scrollLoadLockRef = useRef(false)

    const handelReachEnd = () => {
        if (scrollLoadLockRef.current && currentShowPreviewLength.current < props.previews.length) {
            currentShowPreviewLength.current += 20
            const tmp = []
            for (let i = 0; i < currentShowPreviewLength.current && i < props.previews.length; i++) {
                tmp.push(props.previews[i])
            }
            setPreviewShows(tmp)
        }
    }

    useEffect(() => {
        window.addEventListener('scroll', handelScroll, true)

        console.log('加载预览页面')

        return () => {
            window.removeEventListener('scroll', handelScroll, true)
            console.log('卸载预览页面')
        }
    }, [])

    const lastE = useRef(0);
    const handelScroll = (e) => {
        const dis2trigger = 3
        if (e.target.documentElement === undefined) return
        const end = e.target.documentElement.scrollHeight - e.target.documentElement.scrollTop - e.target.documentElement.clientHeight
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            console.log("reach the end")
            handelReachEnd()
        }
        lastE.current = end
    }


    const BottomButton = styled(Button)(({ theme }) => ({
        marginTop: props.spacingPX + "px",
        color: theme.palette.button.loadMore.text,
        backgroundColor: theme.palette.button.loadMore.main,
        width: "100%",
        height: 50,
        "&:hover": {
            background: theme.palette.button.loadMore.hover,
        },
    }));

    return (
        <div
            style={{
                width: "100%",
                overflow: "hidden",
            }}
        >
            <div style={{
                width: `calc(100% + ${props.spacingPX}px)`,
                overflow: "hidden",
            }}>
                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    spacing={props.spacingPX + "px"}
                    sx={{ width: "100%" }}
                >
                    {
                        previewShows.map((item, index) => {
                            return (
                                <Grid key={index} item xs={props.xs}
                                    onClick={
                                        () => {
                                            localStorage.setItem(`/viewing/${props.gid}/${props.token}/`, index + 1)
                                            // window.open(`/#/viewing/${props.gid}/${props.token}/`, "_blank")
                                            props.openNew(`/viewing/${props.gid}/${props.token}/`, "")
                                        }
                                    }
                                >
                                    <PreviewLoadingImg src={item} />

                                </Grid>
                            )
                        })
                    }
                </Grid>
            </div>
            <div >
                {
                    (previewButtonShow && props.previews.length > 20)
                        ?
                        <BottomButton
                            name='clickable'
                            onClick={() => {
                                setPreviewButtonShow(false)
                                scrollLoadLockRef.current = true
                                handelReachEnd()
                            }} >
                            {'查看全部'}
                        </BottomButton>
                        : null
                }
            </div>
        </div>
    )
}