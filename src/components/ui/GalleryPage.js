
import AutorenewIcon from '@mui/icons-material/Autorenew';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Button, Grid, IconButton, Rating, Typography, useMediaQuery } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import timeTools from '../utils/TimeFormatTools.js';
import CommentPanel from './GalleryPageComponents/CommentPanel.js';
import DeleteButton from './GalleryPageComponents/DeleteButton.js';
import DownloadButton from './GalleryPageComponents/DownloadButton.js';
import FavoriteButton from './GalleryPageComponents/FavoriteButton.js';
import InfoPanel from './GalleryPageComponents/InfoPanel.js';
import PreviewPanel from './GalleryPageComponents/PreviewPanel.js';
import TagPanel from "./GalleryPageComponents/TagPanel.js";
import ZipDownloadButton from './GalleryPageComponents/ZipDownloadButton.js';
import LoadingAnime from './LoadingAnime';
import syncedDB from '../utils/mobxSyncedState';
import {
    addFavorite,
    removeFavorite,
    downloadGallery,
    deleteGallery,
    continueDownload
} from '../api/serverApi.js';
import { getSetting } from '../utils/SettingHooks';
import { observer } from "mobx-react";

const transformTags = (g_data) => {
    let tags = {}
    g_data.tags.forEach(tagStr => {
        if (tagStr.split(":").length === 2) {
            tags[tagStr.split(":")[0]] = []
        } else {
            tags["other"] = []
        }
    })
    g_data.tags.forEach(tagStr => {
        if (tagStr.split(":").length === 2) {
            tags[tagStr.split(":")[0]].push(tagStr.split(":")[1])
        } else {
            tags["other"].push(tagStr)
        }
    })
    return tags
}

const getComment = async (gid, token) => {
    if (window.serverSideConfigure.type === "full" && localStorage.getItem("offline_mode") !== "true") {
        const response = await fetch(`/comments/${gid}/${token}`)
        if (response.ok) {
            return await response.json()
        } else {
            return []
        }
    } else {
        return []
    }
}

const request_data = async (gid, token) => {
    const comment_async = getComment(gid, token)
    const g_data_response = await fetch(`/Gallery/${gid}_${token}/g_data.json?nocache=true`)
    if (g_data_response.ok) {
        return [await g_data_response.json(), await comment_async, null]
    } else {
        const text = await g_data_response.text()
        try {
            const info = JSON.parse(text)
            const detail = JSON.parse(info.detail)
            return [null, null, detail]
        } catch (error) {
            return [null, null, [text]]
        }
    }
}

/**
 * GalleryPage完整组件
 * @param {object} props
 * @param {number} props.gid
 * @param {string} props.token 
 * TODO 相关功能的接口函数
 */
function GalleryPage_inner(props) {
    const [pageState, setPageState] = useState("init")
    const [errorInfo, setErrorInfo] = useState(["unknown error"])
    const [g_data, setG_data] = useState(null)
    const [comments, setComments] = useState([])
    const fetchData = async () => {
        setPageState("init")
        const [g_data, comments, error] = await request_data(props.gid, props.token)
        console.log(g_data, comments, error)
        if (!error) {
            setG_data(g_data)
            setComments(comments)
            setPageState("finish")
            document.title = g_data.title_jpn || g_data.title
        } else {
            console.log(error)
            setErrorInfo(error)
            setPageState("error")
        }
    }

    useEffect(() => {
        fetchData()
        return () => { }
    }, [])
    return (
        <div
            style={{
                height: "100vh",
                width: "100%"
            }}
        >
            {
                pageState === "init" ? <LoadingAnime /> : null
            }{
                pageState === "finish" ? <GalleryPageUI
                    g_data={g_data}
                    comments={comments}
                    downloadInfo={
                        syncedDB.download[props.gid]
                        ||
                        {
                            state: 0,
                            success: 0
                        }
                    }
                    favorite={syncedDB.favorite[props.gid] || {state:0}}
                    requestDownload={async () => { downloadGallery(props.gid, props.token) }}
                    requestDelete={async () => { deleteGallery(props.gid, props.token) }}

                    openRead={props.openRead}

                    addFavorite={async () => {
                        const defaultIndex = getSetting("收藏夹", 9)
                        addFavorite(props.gid, props.token, defaultIndex)
                    }}
                    removeFavorite={async () => { removeFavorite(props.gid, props.token) }}

                    onTagClick={props.onTagClick}

                /> : null
            }{
                pageState === "error" ? <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                        height: "100%",
                        width: "100%"
                    }}
                >
                    <IconButton
                        sx={{
                            backgroundColor: "#00000000",
                            color: "primary.main",
                        }}
                        onClick={fetchData}
                    >
                        <AutorenewIcon sx={{ fontSize: 200 }} />
                    </IconButton>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'left',
                            margin: "100px 20px 0px 20px"
                        }}
                    >{
                            errorInfo.map(item => <a key={item}>{item}</a>)
                        }</div>
                </Grid> : null
            }
        </div>
    )
}


/**
 * GalleryUI组件
 * @param {object} props 
 * @param {object} props.g_data 原始画廊数据
 * @param {object[]} props.comments 评论
 * @param {object} props.downloadInfo 下载信息
 * @param {Number} props.downloadInfo.state 下载状态
 * @param {Number} props.downloadInfo.success 下载成功数
 * @param {Number} props.favorite.state 收藏状态 0:未收藏 1:fetching 2:已收藏 3:无法操作
 * @param {function} props.requestDownload 下载请求
 * @param {function} props.requestDelete 删除请求
 * @param {function} props.openRead 开启阅读
 * @param {function} props.addFavorite 添加收藏
 * @param {function} props.removeFavorite 删除收藏
 * @param {function} props.onTagClick
 */
function GalleryPageUI(props) {
    const matches = useMediaQuery('(min-width:800px)');
    const small_matches = useMediaQuery('(min-width:560px)');
    const borderWidth = useMemo(() => {
        return small_matches ? 24 : 12
    }, [small_matches])

    const onlineFunctionDisabled = !(window.serverSideConfigure.type === "full" && localStorage.getItem("offline_mode") !== "true")

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

    const readButton = <Button
        sx={{
            width: "100%",
            height: 42,
            backgroundColor: "button.readAndDownload.main",
            "&:hover": {
                backgroundColor: "button.readAndDownload.hover",
            },
            color: "button.readAndDownload.text",
        }}
        name='clickable'
        onClick={ () => props.openRead(props.g_data.gid,props.g_data.token)}
        variant="contained" >
        {"阅读"}
    </Button>

    const FunctionButtons = <Grid
        container
        direction="row"
        justifyContent="space-evenly"
        alignItems="flex-start"
    >
        <Grid item xs={!onlineFunctionDisabled ? 5 : 12}>{readButton}</Grid>
        {!onlineFunctionDisabled ? <Grid item xs={!onlineFunctionDisabled ? 5 : 12}>
            <DownloadButton
                forceDisable={onlineFunctionDisabled}
                state={props.downloadInfo.state}
                total={Number(props.g_data.filecount)}
                success={props.downloadInfo.success}
                requestDownload={props.requestDownload}
            /></Grid> : null}
    </Grid>

    return (
        <div>
            <div className={matches ? classes.borderCard : classes.matches_borderCard} >
                <div className={classes.elemContainer}>
                    <Grid
                        container
                        spacing={3}
                        sx={{
                            height: matches ? 324 : "100%",
                        }}
                    >
                        <Grid item xs={4}>
                            <div style={{ width: "100%", borderRadius: 5, overflow: "hidden", height: 0, paddingBottom: "141%", }}>
                                <img style={{ width: "100%", borderRadius: 5 }} alt="cover" src={`/cover/${props.g_data.gid}_${props.g_data.token}.jpg`} />
                            </div>
                        </Grid>

                        <Grid item xs={8}>
                            <Grid
                                sx={{ height: "100%" }}
                                container
                                direction="column"
                                justifyContent="space-between"
                                alignItems="flex-start"
                            >
                                <InfoPanel
                                    g_data={props.g_data}
                                    shows={
                                        small_matches ?
                                            ["title", "uploader", "fileCountAndSize", "posted", "category", "rating"]
                                            :
                                            ["title", "uploader", "category"]
                                    }
                                />
                                {matches ? FunctionButtons : null}
                            </Grid>
                        </Grid>
                    </Grid>
                </div >
                {
                    !matches ?
                        <div className={classes.elemContainer}>
                            {FunctionButtons}
                        </div> : null
                }
                {
                    !small_matches ?
                        <div className={classes.elemContainer}>
                            <Grid
                                container
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                            >
                                <Grid item xs={4}>
                                    <Typography sx={{ color: "text.primary" }} variant="body1" gutterBottom component="div">{props.g_data.filecount} 页  &nbsp;&nbsp;&nbsp;   {"" + Math.round(props.g_data.filesize / 10485.76) / 100} MB</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography sx={{ color: "text.primary", float: "right" }} variant="body1" gutterBottom component="div">{timeTools.timestamp_to_str(props.g_data.posted, 'yy-MM-dd hh:mm')}</Typography>
                                </Grid>
                                <Grid item xs={12} sx={{ textAlign: "center" }}  >
                                    <Rating
                                        name="customized-empty"
                                        defaultValue={Number(props.g_data.rating)}
                                        precision={0.1}
                                        emptyIcon={<StarBorderIcon fontSize="inherit" />}
                                        readOnly={true}
                                        size="medium"
                                    />
                                </Grid>
                            </Grid>
                        </div> : null
                }
                <div className={classes.elemContainer} style={{ height: 42 }} >
                    <Grid
                        container
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ width: "100%" }}
                    >
                        <DeleteButton
                            gid={props.g_data.gid}
                            token={props.g_data.token}
                            forceDisable={onlineFunctionDisabled}
                            canDelete={props.downloadInfo.state !== 0}//不是未下载 就可以删除
                            title={props.g_data.title_jpn || props.g_data.title}
                            requestDelete={props.requestDelete}
                        />
                        <FavoriteButton
                            forceDisable={onlineFunctionDisabled}
                            state={props.favorite.state}
                            onAdd={props.addFavorite}
                            onRemove={props.removeFavorite}
                        />

                        <ZipDownloadButton
                            gid={props.g_data.gid}
                            token={props.g_data.token}
                        />
                    </Grid>

                </div>

                <div className={classes.elemContainer}>
                    <TagPanel
                        tags={transformTags(props.g_data)}
                        onClick={props.onTagClick}
                    />
                </div>

                <div className={classes.elemContainer}>
                    <CommentPanel
                        comments={props.comments}
                        spacingPX={borderWidth}
                        gid={props.g_data.gid}
                        token={props.g_data.token}
                    />
                </div>

                <div className={classes.elemContainer}>
                    <PreviewPanel
                        gid={props.g_data.gid}
                        token={props.g_data.token}
                        pages={Number(props.g_data.filecount)}
                        openRead={props.openRead}
                        xs={matches ? 3 : 4}
                        spacingPX={borderWidth}
                    />
                </div>
                <div className={classes.elemContainer} />
            </div>
            <div
                style={{
                    width: "100%",
                    height: 1,
                }}
            ></div>
        </div>
    )
}



const ItemsObserver = observer(GalleryPage_inner);

function GalleryPage(props) {
    return <div>
        <ItemsObserver {...props} />
    </div>
}

export default GalleryPage;
