
import SendIcon from '@mui/icons-material/Send';
import { Button, ButtonBase, Grid, IconButton, InputBase, LinearProgress, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useRef, useState } from 'react';
import { notifyMessage } from '../../utils/PopoverNotifier';
import timeTools from '../../utils/TimeFormatTools';
import { List, MenuItem, Popover, useMediaQuery } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import { useMemo } from "react";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import EditIcon from '@mui/icons-material/Edit';
import { useLongPress } from 'ahooks';
import copy from 'clipboard-copy'

const useStyles = makeStyles((theme) => ({
    head: {
        marginBottom: "10px",
        height: "15px",
        color: theme.palette.text.primary,
        textAlign: "justify",
        fontSize: "10pt",
        fontWeight: "bold",

    },
    innerHTML: {
        color: theme.palette.text.primary,
        maxWidth: "100%",
        float: "left",
        textAlign: "left",
    }
}));


const CommentPoster = ({ onPost }) => {
    const [text, setText] = useState("");
    const [disabled, setDisabled] = useState(false);
    // const [text, setText] = useState("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
    const post = async () => {
        if (text.length > 0) {
            setDisabled(true);
            const success = await onPost(text);
            if (success) {
                setText("");
            }
            setDisabled(false);
        }
    }
    return <>
        <div style={{ width: "100%", height: 8 }} />
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "flex-end",
            }}
        >
            <InputBase
                sx={{
                    width: "calc(100% - 52px)",
                }}
                multiline
                variant="standard"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={disabled}
                disableUnderline={true}

            />
            <IconButton size="large" onClick={post} sx={{ float: "bottom" }} disabled={disabled}>
                <SendIcon fontSize="inherit" sx={{ color: disabled ? "button.iconFunction.disabled" : "button.iconFunction.main" }} />
            </IconButton>
        </div>
        <div style={{ backgroundColor: "#4C4C4C", width: "100%", height: "3px" }} />
    </>
}



const CommentClickMenu = ({ x, y, comment, isUploader, isSelf, canVote, onClose, }) => {//复制 点赞 点踩 删除自己的
    const unFullScreen = useMediaQuery("(min-width:560px)")
    const open = useMemo(() => {
        return x > -1 && y > -1
    }, [x, y])
    return <Backdrop invisible={unFullScreen} open={open} onClick={onClose} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} >
        <Popover
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={unFullScreen ? { left: x, top: y } : { left: document.body.clientWidth / 2, top: document.body.clientHeight / 2 }}
            transformOrigin={unFullScreen ? undefined : { vertical: 'center', horizontal: 'center', }}
        >
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                sx={{ padding: "3px" }}
                spacing={"8px"}
            >
                <Grid item>
                    <IconButton size="large" onClick={
                        async () => {
                            await copy(comment.text)
                            notifyMessage("success", "复制成功")
                        }
                    } >
                        <ContentPasteIcon fontSize="inherit" />
                    </IconButton>
                </Grid>
                {!isUploader && canVote && <Grid item>
                    <IconButton size="large">
                        <ThumbUpOffAltIcon fontSize="inherit" />
                    </IconButton>
                </Grid>}
                {!isUploader && canVote && <Grid item>
                    <IconButton size="large">
                        <ThumbDownOffAltIcon fontSize="inherit" />
                    </IconButton>
                </Grid>}
                {isSelf && <Grid item>
                    <IconButton size="large">
                        <EditIcon fontSize="inherit" />
                    </IconButton>
                </Grid>}
            </Grid>
        </Popover >
    </Backdrop>
}

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
    const CommentContainer = styled(Button)(({ theme }) => ({
        padding: "8px 4px",
        borderRadius: 0,
        textTransform: "none",
        color: theme.palette.button.commentCard.text,
        backgroundColor: theme.palette.button.commentCard.main,
        "&:hover": {
            background: theme.palette.button.commentCard.hover,
        },
    }));

    const CommentRender = ({ row, index, onOpenMenu }) => {
        const ref = useRef(null);
        const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenMenu({
                comment: row,
                isUploader: false,
                isSelf: false,
                canVote: false,
                x: e.clientX,
                y: e.clientY,
            })
        }
        useLongPress(onClick, ref, {
            delay: 500,
            preventDefault: true,
            stopPropagation: true,
        })
        return <div key={index} style={{ width: "100%", }}>
            <CommentContainer
                style={{ width: "100%", }}
                ref={ref}
                onContextMenu={onClick}
                onClick={onClick}
            >
                <div style={{ width: "100%", }}>
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
            </CommentContainer>
            <div style={{ backgroundColor: "#4C4C4C", width: "100%", height: "3px" }} />
        </div>
    }


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
    const [commentClickMenuProps, setCommentClickMenuProps] = useState({
        comment: null,
        isUploader: false,
        isSelf: false,
        canVote: false,
        x: -1,
        y: -1,
    })

    return (
        <div style={{ width: "100%", }}>
            <CommentClickMenu
                {...commentClickMenuProps}
                onClose={() => setCommentClickMenuProps(old => ({
                    ...old,
                    x: -1,
                    y: -1,
                }))}
            />
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
                    (expanded ? commentData : commentData.slice(0, 4)).map((row, index) => <CommentRender row={row} index={index} onOpenMenu={setCommentClickMenuProps} key={JSON.stringify(row)} />)
                }
            </Grid>
            {
                expanded ?
                    <div >
                        <CommentPoster
                            onPost={async (text) => {
                                const res = await fetch("/list/watched")
                                return true
                            }}
                        />
                        {
                            canLoadMore && <BottomButton
                                name='clickable'
                                onClick={loadMoreComment} >
                                {'加载更多'}
                            </BottomButton>
                        }
                        {loading && <LinearProgress sx={{ margin: "47px 0px" }} />}
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