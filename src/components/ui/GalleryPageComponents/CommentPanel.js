
import { Button, Grid, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';
import { notifyMessage } from '../../utils/PopoverNotifier';
import timeTools from '../../utils/TimeFormatTools';


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




/**
 * 评论面板
 * width = 100%
 * height自动
 * 外部控制两边留空
 * @param {object} props 
 * @param {object[]} commentData
 * @param {Number} props.spacingPX
 */
export default function CommentPanel(props) {

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

    const classes = useStyles();
    let comment_init_all_show = false//评论初始化是否全部显示
    const [commentData, setCommentData] = useState(props.comments.data);


    if (commentData.length <= 4) {
        let len_limit_reached = false;
        commentData.forEach((comment) => {
            len_limit_reached = len_limit_reached || comment.short.length > 40
        })
        comment_init_all_show = !len_limit_reached//评论小于4条 且每条长度小于40 则直接显示
    } else {
        comment_init_all_show = false//大于四条始终不全部显示
    }
    const [expanded, setExpanded] = useState(comment_init_all_show)

    const [canLoadMore, setCanLoadMore] = useState(!props.comments.all)
    const [loading, setLoading] = useState(false)
    const loadMoreComment = async () => {
        setCanLoadMore(false)
        setLoading(true)
        const response = await fetch(`/comments/all/${props.gid}/${props.token}`)
        if (response.ok) {
            const allComments = await response.json()
            setCommentData(allComments.data)
        }
        else {
            setCanLoadMore(true)
            const text = await response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", JSON.parse(info.detail))
            } catch (error) {
                notifyMessage("error", text)
            }
        }
        setLoading(false)
    }

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
                    (expanded ? commentData : commentData.slice(0, 4)).map((row, index) => {
                        return (
                            <div key={index} style={{ width: "100%", }}>
                                <div name='clickable' style={{ width: "100%", }}>
                                    <div className={classes.head}>
                                        <div style={{ float: "left" }}><a style={{ marginRight: 16 }} >{"[" + timeTools.comment_time_reformat(row.post_date) + "]"}</a><a>{row.poster}{row.score === "" ? " (上传者)" : " "}</a></div>
                                        <div style={{ float: "right" }}><a>{row.score}</a></div>
                                    </div>
                                    {
                                        expanded ?
                                            <div className={classes.innerHTML} dangerouslySetInnerHTML={{ __html: row.html }} /> :
                                            <div className={classes.innerHTML}  >{row.short}</div>
                                    }
                                </div>
                                <hr color="#4C4C4C" size={3} />
                            </div>
                        )
                    })
                }
            </Grid>
            {
                expanded ?
                    <div >
                        {
                            !canLoadMore ? null :
                                <BottomButton
                                    name='clickable'
                                    onClick={loadMoreComment} >
                                    {'加载更多'}
                                </BottomButton>
                        }{
                            loading ?
                                <LinearProgress sx={{ margin: "47px 0px" }} />
                                : null
                        }
                    </div>
                    :
                    <div >
                        <BottomButton
                            name='clickable'
                            onClick={() => { setExpanded(true) }} >
                            {'展开'}
                        </BottomButton>
                    </div>

            }

        </div>
    )

}