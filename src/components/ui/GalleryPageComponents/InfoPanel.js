import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Rating, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import getCategoryColor from '../../utils/GetCategoryColor';
import timeTools from '../../utils/TimeFormatTools';
import EditableRating from './EditableRating';


const HeadDiv = styled("div")(({ theme }) => ({
    fontSize: "16pt",
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: '3',
    WebkitBoxOrient: 'vertical',
}));


/**
 * 信息面板
 * 可用数组控制显示的内容
 * @param {object} props 
 * @param {object} props.g_data
 * @param {string[]} props.shows
 */
export default function InfoPanel(props) {
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
                props.shows.indexOf("fileCountAndSize") === -1 ? null :
                    <Typography sx={{ color: "text.primary" }} variant="body1" gutterBottom component="div">{props.g_data.filecount} 页  &nbsp;&nbsp;&nbsp;   {"" + Math.round(props.g_data.filesize / 10485.76) / 100} MB</Typography>}
            {
                props.shows.indexOf("posted") === -1 ? null :
                    <Typography sx={{ color: "text.primary" }} variant="body1" gutterBottom component="div">{timeTools.timestamp_to_str(props.g_data.posted, 'yy-MM-dd hh:mm')}</Typography>}
            {
                props.shows.indexOf("category") === -1 ? null :
                    <div style={{
                        margin: "0px 0px 0px 0px",
                        backgroundColor: getCategoryColor(props.g_data.category),
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
                    <EditableRating
                        defaultValue={Number(props.g_data.rating)}
                        precision={0.5}
                        emptyIcon={<StarBorderIcon fontSize="inherit" />}
                        size="medium"
                        gid={props.g_data.gid}
                        token={props.g_data.token}
                        extended={props.g_data.extended}
                    />
                </div>}
        </div>
    )
}