import React, { useRef } from 'react';
import { makeStyles } from '@mui/styles';

import { ButtonBase } from '@mui/material';
// import ButtonBase from '@mui/material/ButtonBase';
import Rating from '@mui/material/Rating';
import useMediaQuery from '@mui/material/useMediaQuery';

import { styled } from '@mui/material/styles';

import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';



const small_matches = true;
const height = small_matches ? 200 : 160;

const width = "100%";
const colormap = {
    "Manga": "#FF9700",
    "Doujinshi": "#F44236",
    "Non-H": "#9C28B1",
    "Cosplay": "#9C28B1",
    "Image Set": "#3F51B5",
    "Western": "#8BC24A",
    "Game CG": "#4CB050",
    "Misc": "#D90051",
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
        backgroundColor: "#191919"
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

    },
    details: {
        position: "absolute",
        right: "0px",
        bottom: "30px",
        display: "flex",
    },
    d_icon: {
        margin: "0px 0px 0px 8px"
    },
    d_icon_img: {
        width: "18px",
        height: "18px"
    }
}));







const GallaryContainer = styled(ButtonBase)(({ theme }) => ({
    width: "100%",
    display: "flex",
    backgroundColor: "#191919",
    color: "#DDDDDD",
    borderRadius: "2px",
    overflow: "hidden",
    boxSizing: "border-box",
}));





export default function GallaryCard(props) {
    // const matches = useMediaQuery('(min-width:830px)');
    const small_matches = useMediaQuery('(min-width:560px)');
    const relative_height = small_matches ? 200 : 160;
    const classes = useStyles();
    const touchEvent = useRef({})
    return (
        <GallaryContainer
            style={
                small_matches ?
                    {
                        height: relative_height,
                        fontSize: "20px"
                    } :
                    {
                        height: relative_height,
                        fontSize: "16px"
                    }
            }
            onClick={() => {
                props.callBack(props.data)
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                props.longClickCallback(props.data, e.clientX, e.clientY)

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
                            props.data,
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
                    //     props.callBack(props.data)
                    // }
                    touchEvent.current.prevent = true
                }
            }}
        >
            <div style={{
                height: relative_height,
                width: relative_height / 1.39,
            }} className={classes.imgContainer}>
                <img style={{ width: relative_height / 1.39, }} className={classes.imgContainer_img} src={props.data.imgSrc} alt={`cover of ${props.data.name}`} />
            </div>
            <div className={classes.infoContainer}>
                <div className={classes.name_container}>
                    <div className={classes.name_text}>
                        <a>{props.data.name}</a>
                    </div>
                </div>
                <div style={{ height: relative_height - 75 }} className={classes.infos}>
                    <div className={classes.rank}>
                        <Rating name="read-only" value={props.data.rank} precision={0.5} max={5} readOnly />
                    </div>
                    <div style={{ backgroundColor: colormap[props.data.category], }} className={classes.category}>
                        <a>{props.data.category.toUpperCase()}</a>
                    </div>
                    <div className={classes.upload_time}>{props.data.uploadtime}</div>
                    <div className={classes.details}>
                        {
                            props.data.downloaded ?
                                <div className={classes.d_icon}>
                                    <DownloadIcon fontSize={small_matches ? "medium" : "small" }  />
                                </div>
                                : null
                        }
                        {
                            props.data.favo ?
                                <div className={classes.d_icon}>
                                    <FavoriteIcon fontSize={small_matches ? "medium" : "small" } />
                                </div>
                                : null
                        }
                        {
                            props.data.lang in languageMap ?
                                <div className={classes.d_icon}>{languageMap[props.data.lang]}</div> : null
                        }
                        <div className={classes.d_icon}>{props.data.pages + "P"}</div>
                    </div>
                </div>
            </div>
        </GallaryContainer>
    )
}
