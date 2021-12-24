
import React, { useState ,useEffect} from 'react';
import { Button,  Grid } from '@mui/material';


/**
 * width = 100%的组件
 * height自动
 * 外部控制两边留空
 */
export default function CommentPanel(props) {
    const [commentButtonShow, setCommentButtonShow] = useState(false)
    useEffect(() => {
        if (props.comments.length <= 4) {
            setCommentButtonShow(false)
        } else { 
            setCommentButtonShow(true)
        }
    }, [props.comments]);
    return (
        <div style={{
            width: "100%",
        }}>
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
                            <div key={index}>
                                <div style={
                                    {
                                        marginTop: "10px",
                                        marginBottom: "10px",
                                        height: "15px",
                                        color: "#f1f1f1",
                                        textAlign: "justify",
                                        fontSize: "10pt",
                                        fontWeight: "bold",
                                    }
                                }>
                                    <div style={{ float: "left" }}><a>{row.poster}{row.score === "" ? " (上传者)" : " "}</a></div>
                                    <div style={{ float: "right" }}><a>{row.score}</a></div>
                                </div>
                                {
                                    !commentButtonShow ?
                                        <div style={{color:"#ffffff"}}  dangerouslySetInnerHTML={{ __html: row.text }} /> :
                                        <div style={{ color: "#ffffff" }}  >{row.bref}</div>
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
                        <Button
                            sx={{
                                marginTop: props.spacingPX + "px",
                                color: "white",
                                backgroundColor: "#303030",
                                width: "100%",
                                height: 50,
                                "&:hover": {
                                    background: "#646464",
                                },
                            }}
                            onClick={() => { setCommentButtonShow(false)}} >
                            {'展开'}
                        </Button>
                        : null
                }
            </div>
        </div>
    )

}