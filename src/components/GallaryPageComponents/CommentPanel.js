
import { Button, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useEffect, useState } from 'react';
import timeTools from '../utils/TimeFormatTools';

/**
 * width = 100%的组件
 * height自动
 * 外部控制两边留空
 */


const useStyles = makeStyles((theme) => ({
    head: {
        marginTop: "10px",
        marginBottom: "10px",
        height: "15px",
        color: theme.palette.text.primary,
        textAlign: "justify",
        fontSize: "10pt",
        fontWeight: "bold",

    },
    innerHTML: {
        color: theme.palette.text.primary,
        maxWidth: "100%"
    }
}));


const month_2_num = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
]
const post_date_format = (date_str) => {
    let format = date_str
    month_2_num.forEach((month, index) => {
        format = format.replace(month, index + 1)
    })
    const reg = /(\d+) (\d+) (\d+), (\d+):(\d+)/
    const [, day, month, year, hour, minute] = reg.exec(format)
    //8小时时差
    const greenwich_time = new Date(year, month - 1, day, hour, minute).getTime() + 8 * 60 * 60 * 1000
    const date = new Date(greenwich_time)
    if (new Date().getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
        return `${Math.floor((new Date().getTime() - date.getTime()) / (60 * 60 * 1000))} hours ago`
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
    }

}


export default function CommentPanel(props) {
    const classes = useStyles();

    const [commentButtonShow, setCommentButtonShow] = useState(false)
    useEffect(() => {
        if (props.comments.length <= 4) {
            let flag = false;
            for (let comment of props.comments) {
                if (comment.text.length > 40) {
                    flag = true;
                }
            }
            setCommentButtonShow(flag)//评论小于4条 且每条长度小于40 则直接显示
        } else {
            setCommentButtonShow(true)//否则显示查看更多按钮
        }
    }, [props.comments]);


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
        <div style={{ width: "100%", }}>
            <Grid
                sx={{
                    width: "100%",
                }}
                container
                direction="column"
                justify="space-between"
                alignItems="left"
            >
                {
                    (commentButtonShow ? props.comments.slice(0, 4) : props.comments).map((row, index) => {
                        return (
                            <div key={index} style={{ width: "100%", }}>
                                <div name='clickable' style={{ width: "100%", }}>
                                    <div className={classes.head}>
                                        <div style={{ float: "left" }}><a style={{ marginRight: 16 }} >{"["+timeTools.comment_time_reformat(row.post_date)+"]"}</a><a>{row.poster}{row.score === "" ? " (上传者)" : " "}</a></div>
                                        <div style={{ float: "right" }}><a>{row.score}</a></div>
                                    </div>
                                    {
                                        !commentButtonShow ?
                                            <div className={classes.innerHTML} dangerouslySetInnerHTML={{ __html: row.text }} /> :
                                            <div className={classes.innerHTML}  >{row.bref}</div>
                                    }
                                </div>
                                <hr color="#4C4C4C" size={3} />
                            </div>
                        )
                    })
                }
            </Grid>
            <div >
                {
                    commentButtonShow ?
                        <BottomButton
                            name='clickable'
                            onClick={() => { setCommentButtonShow(false) }} >
                            {'展开'}
                        </BottomButton>
                        : null
                }
            </div>
        </div>
    )

}