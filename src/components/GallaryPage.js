import React, { useState, useEffect, useRef } from 'react';

import { Button, Paper, Grid, Snackbar, Rating, Alert, useMediaQuery, Card, Typography, Box } from '@mui/material';

import GetTranslate from "./GetTranslate.js"
import TagPanel from "./GallaryPageComponents/TagPanel.js"
import InfoPanel from './GallaryPageComponents/InfoPanel.js';
import CommentPanel from './GallaryPageComponents/CommentPanel.js';
import PreviewPanel from './GallaryPageComponents/PreviewPanel.js';

import StarBorderIcon from '@mui/icons-material/StarBorder';

import { styled, makeStyles, withStyles } from '@mui/styles';

import LoadingAnime from './LoadingAnime';

import { useLocation, NavLink } from "react-router-dom";
import DownloadButton from './GallaryPageComponents/DownloadButton.js';
import ZipDownloadButton from './GallaryPageComponents/ZipDownloadButton.js';
import DeleteButton from './GallaryPageComponents/DeleteButton.js';
import PopoverNotifier from './PopoverNotifier.js';
import FavoButton from './GallaryPageComponents/FavoButton.js';





const formatTime = (time, format) => {
    const date = new Date(Number(time + "000"))
    // console.log(time, date)
    var o = {
        "M+": date.getMonth() + 1, // 月份
        "d+": date.getDate(), // 日
        "h+": date.getHours(), // 小时
        "m+": date.getMinutes(), // 分
        "s+": date.getSeconds(), // 秒
        "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
        "S": date.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (date.getFullYear() + ""));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return format;
}



const transformTags = (g_data) => {
    console.log("transformTags", g_data)
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


export default function GallaryPage(props) {
    const location = useLocation();

    const [loading, setLoading] = useState(true)

    const [g_data, setG_data] = useState(null)
    const g_data_ref = useRef(null)
    //这里没问题 因为渲染g_data是在loading=false之后了
    const [tags, seTags] = useState([])
    const [previews, setPreviews] = useState([])
    const [comments, setComments] = useState([])


    //G_DATA 在加载首页的时候就已经获取到了
    //画廊预览则是使用固定URL向服务器请求 服务器此时再去获取特定画廊的网页信息
    //同时由于使用服务端缓存,评论应该略晚于页面加载，但是在预览图加载之前获取到

    const setPreviewSteped = () => {
        const res = g_data_ref.current
        let prevArrary = [];
        for (let i = 1; i <= Number(res.filecount); i++) {
            if (window.serverSideConfigure.type === "Data.db"
                || window.serverSideConfigure.type === "staticApi"
                || localStorage.getItem("offline_mode") === "true"
                //数据库模式 或 静态API模式 或 前端开启离线模式
                //previews 都是用真实图片而不是预览图片
            ) {
                prevArrary.push(`/gallarys/${res.gid}_${res.token}/${(Array(8).join(0) + i).slice(-8)}.jpg`)
            } else {
                prevArrary.push(`/previews/${res.gid}_${res.token}/${(Array(8).join(0) + i).slice(-8)}.jpg`)
            }
        }
        setPreviews(prevArrary)
    }


    useEffect(() => {
        setLoading(true)
        const gid = location.pathname.split("/")[2]
        const token = location.pathname.split("/")[3]

        let g_data_url = `/gallarys/${gid}_${token}/g_data.json`
        if (window.serverSideConfigure.type === "full" && localStorage.getItem("offline_mode") !== "true") { 
            g_data_url = g_data_url+"?nocache=true"
        }
        console.log("g_data_url", g_data_url)

        fetch(g_data_url).then(res => res.json()).then(res => {
            document.title = res.title_jpn || res.title
            setG_data(res)
            g_data_ref.current = res
            seTags(transformTags(res))
            setPreviewSteped()
            setLoading(false)
        }).catch(err => {
            console.log("err", err)
        })

        if (window.serverSideConfigure.type === "full" && localStorage.getItem("offline_mode") !== "true") {
            fetch(`/comments/${gid}_${token}`).then(res => res.json()).then(res => {
                setComments(res)
            }).catch(err => {
                console.log("err", err)
            })
        }

    }, [])
    return (
        loading ?
            <LoadingAnime />
            :

            <GallaryInfoPage
                g_data={g_data}
                tags={tags}
                previews={previews}
                comments={comments}//comments = [] 则不显示，同事点击加载全部评论之后也会不显示
                match={"large" || "normal" || "small"}
            />
    )
}




function GallaryInfoPage(props) {
    const matches = useMediaQuery('(min-width:800px)');
    const small_matches = useMediaQuery('(min-width:560px)');
    const borderWidth = small_matches ? 24 : 12

    const useStyles = makeStyles((theme) => (
        {
            borderCard: {
                margin: "0 auto",
                marginTop: 40,
                marginBottom: 40,
                width: 754,
                borderRadius: 20,
                color: "#303030",
                boxShadow: "7px 7px 14px #1b1b1b , -7px -7px 14px #454545",
                overflow: "hidden"
            },
            matches_borderCard: {
                margin: "0 auto",
                marginBottom: 40,
                color: "#303030",
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

    const FunctionButton = (props) => {
        return (<Button
            sx={{
                width: "100%",
                height: 42,
                // backgroundColor: "#d90051"
                backgroundColor: "#4a4a4a",
                "&:hover": {
                    backgroundColor: "#646464",
                }
            }}
            onClick={props.onClick}
            variant="contained" >
            {props.text}
        </Button>)
    }

    const FCBS = (props) => {
        if (window.serverSideConfigure.type === "full" && localStorage.getItem("offline_mode") !== "true") {
            return (
                <Grid
                    container
                    direction="row"
                    justifyContent="space-evenly"
                    alignItems="flex-start">
                    <Grid item xs={props.bxs}>
                        <FunctionButton text="阅读" onClick={() => {
                            window.open(`/#/viewing/${props.g_data.gid}/${props.g_data.token}/`, "_blank")
                        }} />
                    </Grid>
                    <Grid item xs={props.bxs}>
                        <DownloadButton g_data={props.g_data} />
                    </Grid>
                </Grid>
            )
        }
        else { 
            return <Grid
                container
                direction="row"
                justifyContent="space-evenly"
                alignItems="flex-start">
                <Grid item xs={12}>
                    <FunctionButton text="阅读" onClick={() => {
                        window.open(`/#/viewing/${props.g_data.gid}/${props.g_data.token}/`, "_blank")
                    }} />
                </Grid>
            </Grid>
        }

        
    }

    const [notifyMessage, setNotifyMessage] = useState({
        severity: "success",
        text: ""
    })



    return (
        <div className={matches ? classes.borderCard : classes.matches_borderCard} >
            <PopoverNotifier
                message={notifyMessage}
            />
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
                                        ["title", "uploader", "filecountsize", "posted", "category", "rating"]
                                        :
                                        ["title", "uploader", "category"]
                                }
                            />
                            {
                                matches ? <FCBS bxs={5} g_data={ props.g_data}  /> : null
                            }

                        </Grid>
                    </Grid>
                </Grid>
            </div >
            {
                !matches ?
                    <div className={classes.elemContainer}>
                        <FCBS bxs={5} g_data={props.g_data} />
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
                                <Typography sx={{ color: "#ffffff" }} variant="body1" gutterBottom component="div">{props.g_data.filecount} 页  &nbsp;&nbsp;&nbsp;   {"" + Math.round(props.g_data.filesize / 10485.76) / 100} MB</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography sx={{ color: "#ffffff", float: "right" }} variant="body1" gutterBottom component="div">{formatTime(props.g_data.posted, 'yy-MM-dd hh:mm')}</Typography>
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
                        g_data={props.g_data}
                        setNotifyMessage={setNotifyMessage}
                    />
                    <FavoButton 
                        g_data={props.g_data}
                    />
                    
                    <ZipDownloadButton
                        g_data={props.g_data}
                    />
                </Grid>

            </div>

            <div className={classes.elemContainer}>
                <TagPanel tags={props.tags} />
            </div>

            <div className={classes.elemContainer}>
                <CommentPanel
                    comments={props.comments}
                    // comments={commentData}
                    spacingPX={borderWidth}

                />
            </div>

            <div className={classes.elemContainer}>
                <PreviewPanel
                    previews={props.previews}
                    xs={matches ? 3 : 4}
                    spacingPX={borderWidth}
                    gid={props.g_data.gid}
                    token={props.g_data.token}
                />
            </div>
            <div className={classes.elemContainer} />

        </div>
    )
}