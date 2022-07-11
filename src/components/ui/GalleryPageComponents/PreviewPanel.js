import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { Button, Grid } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import { useEventListener } from 'ahooks';
import React, { useEffect, useRef, useState } from 'react';
import { getPreviewImgUrl } from '../../api/serverApi';


function PreviewLoadingImg(props) {
    const [state, setState] = useState(0)//loading error finished
    let img = new Image()
    img.onload = () => {
        setState(1)
        img = null
    }
    img.onerror = () => {
        setState(2)
    }
    img.src = props.src

    const elemMap = {
        0:
            <Skeleton
                name='clickable'
                variant="rectangular"
                style={{
                    width: "100%",
                    height: "0",
                    paddingBottom: "141%",
                    overflow: "hidden",
                    borderRadius: 5
                }} />
        ,
        2:
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
        1:
            <div
                name='clickable'
                style={{
                    width: "100%",
                    height: "0",
                    paddingBottom: "141%",
                    overflow: "hidden",
                    borderRadius: 5,
                }}
            >
                <img src={props.src} style={{ width: "100%", borderRadius: 5 }} alt="prev" />
            </div>
    }
    return elemMap[state]
}


/**
 * 预览面板
 * @param {Object} props
 * @param {Number} props.gid
 * @param {String} props.token
 * @param {Number} props.pages
 * @param {function} props.onRead
 * @param {Number} props.xs
 * @param {Number} props.spacingPX
 * @returns 
 */

export default function PreviewPanel(props) {
    const [previewButtonShow, setPreviewButtonShow] = useState(props.pages > 20)//预览按钮是否显示
    const [previewShowCount, setPreviewShowCount] = useState(props.pages > 20 ? 20 : props.pages)//当前预览数量
    const scrollLoadLockRef = useRef(false)//是否启用滚动加载

    const handelReachEnd = () => {
        if (scrollLoadLockRef.current) {
            setPreviewShowCount((old) => Math.min(old + 20, props.pages))
        }
    }
    const lastE = useRef(0);
    const handelScroll = (e) => {
        const dis2trigger = 3
        if (e.target.documentElement === undefined) return
        const end = e.target.documentElement.scrollHeight - e.target.documentElement.scrollTop - e.target.documentElement.clientHeight
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            handelReachEnd()
        }
        lastE.current = end
    }
    useEventListener('scroll', handelScroll, true)

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
                        Array(previewShowCount).fill(null).map((item, index) => {
                            return (
                                <Grid key={index} item xs={props.xs}
                                    onClick={
                                        () => {
                                            localStorage.setItem(`/viewing/${props.gid}/${props.token}/`, index + 1)
                                            props.openRead(props.gid, props.token)
                                        }
                                    }
                                >
                                    <PreviewLoadingImg src={getPreviewImgUrl(props.gid, props.token, index + 1)} />
                                </Grid>
                            )
                        })
                    }
                </Grid>
            </div>
            <div >
                {
                    previewButtonShow ?
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