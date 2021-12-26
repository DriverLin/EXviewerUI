import React, { useState, useEffect, useRef } from 'react';
import { Button, Paper, Grid, Snackbar, Rating, Alert, useMediaQuery, Card, Typography, Box } from '@mui/material';
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
        return () => { window.removeEventListener('scroll', handelScroll, true) }
    }, [])

    const lastE = useRef(0);
    const handelScroll = (e) => {
        const dis2trigger = 3
        const end = e.target.documentElement.scrollHeight - e.target.documentElement.scrollTop - e.target.documentElement.clientHeight
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            console.log("reach the end")
            handelReachEnd()
        }
        lastE.current = end
    }



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
                    sx={{width: "100%"}}
                >
                    {
                        previewShows.map((item, index) => {
                            return (
                                <Grid key={index} item xs={props.xs}
                                    onClick={
                                        () => {
                                            localStorage.setItem(`/viewing/${props.gid}/${props.token}/`, index + 1)
                                            window.open(`/#/viewing/${props.gid}/${props.token}/`, "_blank")
                                        }
                                    }
                                >
                                    <img style={{ width: "100%", borderRadius: 5 }} alt="prev" src={item} />

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
                        <Button
                            sx={{
                                marginTop: props.spacingPX+"px",
                                color: "white",
                                backgroundColor: "#303030",
                                width: "100%",
                                height: 50,
                                "&:hover": {
                                    background: "#646464",
                                },
                            }}
                            onClick={() => {
                                setPreviewButtonShow(false)
                                scrollLoadLockRef.current = true
                                handelReachEnd()
                            }} >
                            {'查看全部'}
                        </Button>
                        : null
                }
            </div>
        </div>
    )
}