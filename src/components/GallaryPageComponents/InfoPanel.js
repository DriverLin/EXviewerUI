import React from 'react';

import {  Rating , Typography } from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { styled } from '@mui/material/styles';




export default function InfoPanel(props) {
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
            if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return format;
    }

    const colormap = {
        "Manga": "#FF9700",
        "Doujinshi": "#F44236",
        "Non-H": "#9C28B1",
        "Cosplay": "#9C28B1",
        "Image Set": "#3F51B5",
        "Western": "#8BC24A",
        "Game CG": "#4CB050",
        "Misc": "#F06292",
        "Artist CG": "#9C28B1",
        "": "#00000000"
    };

    const HeadDiv =  styled("div")(({ theme }) => ({
        fontSize: "16pt",
        color: theme.palette.text.primary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: '3',
        WebkitBoxOrient: 'vertical',
    }));

    return (
        <div>
            {
                props.shows.indexOf("title") === -1 ? null :
                    <HeadDiv><a>{props.g_data.title_jpn || props.g_data.title}</a></HeadDiv>}

            {
                props.shows.indexOf("uploader") === -1 ? null :
                    <Typography sx={{ color: "text.primary" }} variant="body1" gutterBottom component="div">{props.g_data.uploader}</Typography>
            }
            {
                props.shows.indexOf("filecountsize") === -1 ? null :
                    <Typography sx={{ color: "text.primary" }} variant="body1" gutterBottom component="div">{props.g_data.filecount} 页  &nbsp;&nbsp;&nbsp;   {"" + Math.round(props.g_data.filesize / 10485.76) / 100} MB</Typography>}

            {
                props.shows.indexOf("posted") === -1 ? null :
                    <Typography sx={{ color: "text.primary" }} variant="body1" gutterBottom component="div">{formatTime(props.g_data.posted, 'yy-MM-dd hh:mm')}</Typography>}

            {
                props.shows.indexOf("category") === -1 ? null :
                    <div style={{
                        margin: "0px 0px 0px 0px",
                        backgroundColor: colormap[props.g_data.category],
                        color: "#ffffff",
                        overflow: "auto",
                        width: "fit-content",
                        padding: "2px 8px",
                    }}>
                        <a>{props.g_data.category}</a>
                    </div>}

            {props.shows.indexOf("rating") === -1 ? null :
                <div style={{
                    margin: "10px 0px 0px 0px",
                    display: "inline-flex"
                }}>
                <Rating
                    name="customized-empty"
                    defaultValue={Number(props.g_data.rating)}
                    precision={0.1}
                    emptyIcon={<StarBorderIcon fontSize="inherit" />}
                    readOnly={true}
                    size="medium"
                />
            </div>}





        </div>
    )
}