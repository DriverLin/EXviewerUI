import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { ButtonBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useEffect, useMemo, useRef } from 'react';
import DownloadCircularProgress from './DownloadCircularProgress';
import Rating from '@mui/material/Rating';
// import Rating from './Rating';
import { observer } from "mobx-react";

const colorMap = {
    "Manga": "#FF9700",
    "Doujinshi": "#F44236",
    "Non-H": "#9C28B1",
    "Cosplay": "#9C28B1",
    "Image Set": "#3F51B5",
    "Western": "#8BC24A",
    "Game CG": "#4CB050",
    "Misc": "#D90051",
    "Artist CG": "#D90051",
    "PRIVATE": "#000000",
};
const languageMap = {
    "chinese": "ZH",
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


const GalleryContainer = styled(ButtonBase)(({ theme }) => ({
    width: "100%",
    display: "flex",
    backgroundColor: theme.palette.button.galleryCard.main,
    color: theme.palette.text.primary,
    borderRadius: "2px",
    overflow: "hidden",
    boxSizing: "border-box",
}));

function GalleryCard_inner(props) {

    const classes = useStyles();

    const containerHeight = useMemo(() => props.small_matches ? 200 : 160, [props.small_matches]);
    const fontSize = useMemo(() => props.small_matches ? "20px" : "16px", [props.small_matches]);

    const touchEvent = useRef({})

    const downloadIconShow = useMemo(() => props.download.state === 3 && props.download.success === Number(props.cardInfo.pages), [props.download])
    const favoriteIconShow = useMemo(() => { return props.favorite.state === 2 }, [props.favorite])
    const fetchingFavoriteIconShow = useMemo(() => { return props.favorite.state === 1 }, [props.favorite])
    const cardText = useMemo(() => {
        if (props.download.state === 0) {
            return `${languageMap[props.cardInfo.lang] || ''} ${props.cardInfo.pages}P`
        }
        if (props.download.state === 1) {
            return "队列中"
        }
        if (props.download.state === 2) {
            return ""
        }
        if (props.download.state === 3) {
            if (props.download.success === Number(props.cardInfo.pages)) {
                return `${languageMap[props.cardInfo.lang] || ''} ${props.cardInfo.pages}P`
            } else {
                return `${Number(props.cardInfo.pages) - props.download.success}项未下载`
            }
        }
        return 'DOWNLOAD STATE ERROR'
    }, [props.download.state])


    // useEffect( () => {
    //     console.log("props.download",props.download)
    // },[props.download])

    return (
        <GalleryContainer
            name='clickable'
            style={{
                height: containerHeight,
                fontSize: fontSize
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                props.onLongClick(
                    props.cardInfo.gid,
                    props.cardInfo.token,
                    props.cardInfo.name,
                    favoriteIconShow,
                    props.download.state > 0,
                    props.download.state === 3 && props.download.success !== Number(props.cardInfo.pages),
                    e.clientX,
                    e.clientY
                )
            }}
            onTouchStart={(e) => {
                touchEvent.current = {
                    moveEvent: e,
                    prevent: false,
                    startTime: new Date().getTime()
                }
                setTimeout(() => {
                    if (touchEvent.current.prevent === false) {
                        props.onLongClick(
                            props.cardInfo.gid,
                            props.cardInfo.token,
                            props.cardInfo.name,
                            favoriteIconShow,
                            props.download.state > 0,
                            props.download.state === 3 && props.download.success !== Number(props.cardInfo.pages),
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
                    touchEvent.current.prevent = true
                }
            }}
        >
            <div
                style={{
                    height: containerHeight,
                    width: containerHeight / 1.39,
                }}
                className={classes.imgContainer}
                onClick={() => {
                    props.onImageClick(props.cardInfo.gid, props.cardInfo.token)
                }}
            >
                <img style={{ width: containerHeight / 1.39, }} className={classes.imgContainer_img} src={`/cover/${props.cardInfo.gid}_${props.cardInfo.token}.jpg`} alt={`cover of ${props.cardInfo.name}`} />
            </div>
            <div
                className={classes.infoContainer}
                onClick={() => {
                    props.onCardClick(props.cardInfo.gid, props.cardInfo.token)
                }}
            >
                <div className={classes.name_container}>
                    <div className={classes.name_text}>
                        <a>{props.cardInfo.name}</a>
                    </div>
                </div>
                <div style={{ height: containerHeight - 75 }} className={classes.infos}>
                    <div className={classes.rank}>
                        <Rating
                            value={Number(props.cardInfo.rank)}
                            precision={0.5}
                            max={5}
                            readOnly
                            size={props.small_matches ? "medium" : "small"}
                        />
                    </div>
                    <div style={{ backgroundColor: colorMap[props.cardInfo.category], }} className={classes.category}>
                        <a style={{ color: "#ffffff" }}  >{props.cardInfo.category.toUpperCase()}</a>
                    </div>
                    <div className={classes.upload_time}>{props.cardInfo.uploadTime}</div>

                    {props.download.state == 2 ?
                        <div className={classes.details}>
                            <a>{`${props.download.success} / ${props.cardInfo.pages}`}</a>
                            <div className={classes.d_icon}>
                                <DownloadCircularProgress
                                    value={100 * (props.download.success) / Number(props.cardInfo.pages)}
                                    small_matches={props.small_matches}
                                />
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
                                favoriteIconShow ?
                                    <div className={classes.d_icon}>
                                        <FavoriteIcon fontSize={props.small_matches ? "medium" : "small"} />
                                    </div>
                                    : null
                            }
                            {
                                fetchingFavoriteIconShow ?
                                    <div className={classes.d_icon}>
                                        <FavoriteIcon sx={{ color: "button.iconFunction.disabled" }} fontSize={props.small_matches ? "medium" : "small"} />
                                    </div>
                                    : null
                            }
                            <div className={classes.d_icon}>{cardText}</div>
                        </div>
                    }
                </div>
            </div>
        </GalleryContainer>
    )
}



const ItemsObserver = observer(GalleryCard_inner);

function GalleryCard(props) {
    return <div>
        <ItemsObserver {...props} />
    </div>
}

export default GalleryCard;
