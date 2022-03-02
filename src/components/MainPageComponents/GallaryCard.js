import React, { useMemo, useRef, useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';

import { ButtonBase } from '@mui/material';
// import ButtonBase from '@mui/material/ButtonBase';
import Rating from '@mui/material/Rating';
import useMediaQuery from '@mui/material/useMediaQuery';

import { styled } from '@mui/material/styles';

import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';

import DownloadProcessbar from './DownloadProcessbar';

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





export default function GallaryCard(props) {
    // const matches = useMediaQuery('(min-width:830px)');
    const small_matches = useMediaQuery('(min-width:560px)');
    const relative_height = small_matches ? 200 : 160;
    const classes = useStyles();
    const touchEvent = useRef({})

    let cardTextInit = ""
    const process = props.data.process
    // let downloadIcon = props.data.downloaded//下载按钮显示 初始等于下载状态
    
    const [downloadIcon, setDownloadIcon] = useState(props.data.downloaded)
    
    
    let langText = ""

    if (props.data.lang in languageMap) {
        langText = languageMap[props.data.lang]
    }
    //未知 下载中 下载完成 未完成 未开始
    // [x,0] 未知
    // [-1,pages] 未开始
    // [0,pages] 下载中
    // [x,pages] 下载结束 x==pages则完成 否则显示多少未下载
    if (process[1] === 0 || process[0] === process[1] ) {
        cardTextInit = langText + " " + props.data.pages + "P"
    }
    else {
        if (process[0] === -1) {
            cardTextInit = "未开始"
        }else {
            setDownloadIcon(false)
            cardTextInit = `${process[1] - process[0]} 项未下载`
        }
    }

    const [cardTextShow, setCardTextShow] = useState(cardTextInit)
    const inProcess = useMemo(() => Number(props.processInfo.gid) === props.data.gid, [props.processInfo])
    const [porcessData, setPorcessData] = useState([0,1])
    const processRec = useRef([-1, 0])
    useEffect(() => {//外部进度变化时
        if (Number(props.processInfo.gid) === props.data.gid) {//对=对应自己 则记录
            const over = props.processInfo.process[0]
            const total = props.processInfo.process[2]
            
            setPorcessData([over, total]) //进度显示
            
            let tmpCardText = ""//文字显示 便于在进度显示完成之后 显示结果
            if (total === 0 || over === total) {
                setDownloadIcon(true)
                tmpCardText = langText + " " + props.data.pages + "P"
            }
            else {
                if (over === -1) {
                    tmpCardText = "未开始"
                } else {
                    setDownloadIcon(false)
                    tmpCardText = `${total-over} 项未下载`
                }
            }
            setCardTextShow(tmpCardText)
        }
    }, [props.processInfo]);
    
    return (
        <GallaryContainer
            name='clickable'
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
            <div
                style={{
                    height: relative_height,
                    width: relative_height / 1.39,
                }}
                className={classes.imgContainer}
                onClick={() => {
                    props.infoCallBack(props.data)
                }}
            >
                <img style={{ width: relative_height / 1.39, }} className={classes.imgContainer_img} src={props.data.imgSrc} alt={`cover of ${props.data.name}`} />
            </div>
            <div
                className={classes.infoContainer}
                onClick={() => {
                    props.viewCallBack(props.data)
                }}
            >
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
                        <a style={{ color: "#ffffff" }}  >{props.data.category.toUpperCase()}</a>
                    </div>
                    <div className={classes.upload_time}>{props.data.uploadtime}</div>

                    {inProcess ?
                        <div className={classes.details}>
                            <a>{porcessData[0] + "/" + porcessData[1]}</a>
                            <div className={classes.d_icon}>
                                <DownloadProcessbar process={100 * porcessData[0] / porcessData[1] } small={!small_matches} />
                            </div>
                        </div>
                        :
                        <div className={classes.details}>
                            {
                                downloadIcon ?
                                    <div className={classes.d_icon}>
                                        <DownloadIcon fontSize={small_matches ? "medium" : "small"} />
                                    </div>
                                    : null
                            }
                            {
                                props.data.favo ?
                                    <div className={classes.d_icon}>
                                        <FavoriteIcon fontSize={small_matches ? "medium" : "small"} />
                                    </div>
                                    : null
                            }
                            <div className={classes.d_icon}>{cardTextShow}</div>
                        </div>
                    }
                </div>
            </div>
        </GallaryContainer>
    )
}
