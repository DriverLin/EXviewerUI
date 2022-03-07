import React, { useMemo, useRef, useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';

import { ButtonBase } from '@mui/material';
// import ButtonBase from '@mui/material/ButtonBase';
// import Rating from '@mui/material/Rating';
import Rating from './Rating';
import useMediaQuery from '@mui/material/useMediaQuery';

import { styled } from '@mui/material/styles';

import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';

import DownloadProcessbar from './DownloadProcessbar';


const colormap = {
    "Manga": "#FF9700",
    "Doujinshi": "#F44236",
    "Non-H": "#9C28B1",
    "Cosplay": "#9C28B1",
    "Image Set": "#3F51B5",
    "Western": "#8BC24A",
    "Game CG": "#4CB050",
    "Misc": "#D90051",
    "Artist CG": "#D90051",
};
const languageMap = {
    "chinese": "ZH",
    "english": "EH"
}

const useStyles = makeStyles((theme) => ({
    imgContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    infoContainer: {
        width: "100%",
    },
    name_container: {
        height: "45px",
        textAlign: "left",
        margin: 10
    },
    name_text: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: '2',
        WebkitBoxOrient: 'vertical',
    },
    infos: {
        margin: "0px 10px 10px 10px",
        position: "relative"
    },
    rank: {
        position: "absolute",
        left: "0px",
        bottom: "30px",
        width: "80px",
        opacity: "1"
    },
    rank_stars: {
        // color: "#d90051"
    },
    category: {
        position: "absolute",
        left: "0px",
        bottom: "0px",
        padding: "2px 8px",
    },
    upload_time: {
        position: "absolute",
        right: "0px",
        bottom: "0px",
        color: theme.palette.text.secondary,
    },
    details: {
        position: "absolute",
        right: "0px",
        bottom: "30px",
        display: "flex",
    },
    d_icon: {
        margin: "0px 0px 0px 8px",
        color: theme.palette.text.secondary
    },
    d_icon_img: {
        width: "18px",
        height: "18px"
    }
}));







const GallaryContainer = styled(ButtonBase)(({ theme }) => ({
    width: "100%",
    display: "flex",
    backgroundColor: theme.palette.button.gallaryCard.main,
    color: theme.palette.text.primary,
    borderRadius: "2px",
    overflow: "hidden",
    boxSizing: "border-box",
}));


// export default function GallaryCard(props) {
//     useEffect(  ()=>{
//         console.log("GallaryCard useEffect",props);
//     },[]  )
//     return <a>hwllo</a>
// }

export default  function GallaryCard(props) {
    let __propsExample = {
        gid: "12356",
        token: "abcdefg",
        cover: "imgSrc",
        name: "gallaryname",
        category: "Manga",
        pages: 28,
        rank:0-5,
        uploadtime: "2020-01-01",
        lang:"chinese",

        inprocess: false,
        download: 19,
        favo: false,
    }
    // useEffect(  ()=>{
        
    //     console.log("props.favo > -1",props.favo > -1,props.favo)
        
    //     console.log(props.gid,"mount");
    //     return () => {
    //         console.log(props.gid,"unmount");
    //     }
    // },[]  )



    const relative_height = useMemo(() => props.small_matches ? 200 : 160, [props.small_matches]);
    const fontSize = useMemo(() => props.small_matches ? "20px" : "16px", [props.small_matches]);
    const classes = useStyles();
    const touchEvent = useRef({})
    const downloadIconShow = useMemo( () => props.download === Number(props.pages),[props.download,props.pages])
    const cardText = useMemo( () => {
        if(props.download > -2 ){
            if(props.download === -1 ){
                return "队列中"
            }else{
                const undownloaded = Number(props.pages) - (props.download >= 0 ? props.download : 0)
                if(undownloaded === 0){
                    return `${  props.lang in languageMap ? languageMap[props.lang] : ""} ${props.pages}P`
                }else{
                    return `${undownloaded}项未下载`
                }
            }
        }else{
            return `${  props.lang in languageMap ? languageMap[props.lang] : ""} ${props.pages}P`
        }
    },[props.download])

    return (
        <GallaryContainer
            name='clickable'
            style={{
                height: relative_height,
                fontSize: fontSize
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                props.longClickCallback(props.gid,props.token,props.name , e.clientX, e.clientY)

            }}
            onTouchStart={(e) => {
                touchEvent.current = {
                    moveEvent: e,
                    prevent: false,
                    startTime: new Date().getTime()
                }
                setTimeout(() => {
                    if (touchEvent.current.prevent === false) {
                        props.longClickCallback(
                            props.gid,
                            props.token,
                            touchEvent.current.moveEvent.touches[0].clientX,
                            touchEvent.current.moveEvent.touches[0].clientY
                        )
                    }
                }, 300)
            }}
            onTouchMove={(e) => {
                if (touchEvent.current.moveEvent.touches[0] !== e.touches[0]) {
                    touchEvent.current.prevent = true//长按中发生移动 阻止 不响应长按也不响应点击
                }
            }}
            onTouchEnd={(e) => {
                if (touchEvent.current.prevent === false) {
                    // if (new Date().getTime() - touchEvent.current.startTime < 250) {
                    //     touchEvent.current.prevent = true//响应点击 阻止长按
                    //     props.callBack(props.gid,props.token)
                    // }
                    touchEvent.current.prevent = true
                }
            }}
        >
            <div
                style={{
                    height: relative_height,
                    width: relative_height / 1.39,
                }}
                className={classes.imgContainer}
                onClick={() => {
                    props.infoCallBack(props.gid,props.token)
                }}
            >
                <img style={{ width: relative_height / 1.39, }} className={classes.imgContainer_img} src={props.imgSrc} alt={`cover of ${props.name}`} />
            </div>
            <div
                className={classes.infoContainer}
                onClick={() => {
                    props.viewCallBack(props.gid,props.token)
                }}
            >
                <div className={classes.name_container}>
                    <div className={classes.name_text}>
                        <a>{props.name}</a>
                    </div>
                </div>
                <div style={{ height: relative_height - 75 }} className={classes.infos}>
                    <div className={classes.rank}>
                        <Rating name="read-only" value={props.rank} precision={0.5} max={5} readOnly />
                    </div>
                    <div style={{ backgroundColor: colormap[props.category], }} className={classes.category}>
                        <a style={{ color: "#ffffff" }}  >{props.category.toUpperCase()}</a>
                    </div>
                    <div className={classes.upload_time}>{props.uploadtime}</div>

                    {props.inprocess ?
                        <div className={classes.details}>
                            <a>{`${props.download >= 0 ? props.download : 0} / ${props.pages}`}</a>
                            <div className={classes.d_icon}>
                                <DownloadProcessbar process={100 * (props.download >= 0 ? props.download : 0) / Number(props.pages)} small={!props.small_matches} />
                            </div>
                        </div>
                        :
                        <div className={classes.details}>
                            {
                                downloadIconShow ?
                                    <div className={classes.d_icon}>
                                        <DownloadIcon fontSize={props.small_matches ? "medium" : "small"} />
                                    </div>
                                    : null
                            }
                            {
                                props.favo > -1 ?
                                    <div className={classes.d_icon}>
                                        <FavoriteIcon fontSize={props.small_matches ? "medium" : "small"} />
                                    </div>
                                    : null
                            }
                            <div className={classes.d_icon}>{cardText}</div>
                        </div>
                    }
                </div>
            </div>
        </GallaryContainer>
    )
}
