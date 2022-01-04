
import React, { useState ,useEffect} from 'react';
import { Button,  Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';


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
        color: theme.palette.text.main,
        textAlign: "justify",
        fontSize: "10pt",
        fontWeight: "bold",

    },
    innerHTML: {
        color: theme.palette.text.main,
        maxWidth: "100%"  
    }
}));


export default function CommentPanel(props) {
    const classes = useStyles();

    const [commentButtonShow, setCommentButtonShow] = useState(false)
    useEffect(() => {
        if (props.comments.length <= 4) {
            setCommentButtonShow(false)
        } else { 
            setCommentButtonShow(true)
        }
    }, [props.comments]);
    

    const BottomButton = styled(Button)(({ theme }) => ({
        marginTop: props.spacingPX + "px",
        color: theme.palette.text.main,
        backgroundColor: theme.palette.background.main,
        width: "100%",
        height: 50,
        "&:hover": {
            background: theme.palette.background.readHover,
        },
    }));


    return (
        <div style={{width: "100%",}}>
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
                                <div className={classes.head}>
                                    <div style={{ float: "left" }}><a>{row.poster}{row.score === "" ? " (上传者)" : " "}</a></div>
                                    <div style={{ float: "right" }}><a>{row.score}</a></div>
                                </div    >
                                {
                                    !commentButtonShow ?
                                        <div className={classes.innerHTML}  dangerouslySetInnerHTML={{ __html: row.text }} /> :
                                        <div className={classes.innerHTML}  >{row.bref}</div>
                                }
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
                            onClick={() => { setCommentButtonShow(false)}} >
                            {'展开'}
                        </BottomButton>
                        : null
                }
            </div>
        </div>
    )

}