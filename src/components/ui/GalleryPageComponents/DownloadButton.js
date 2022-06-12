import { Button, LinearProgress } from '@mui/material';
import React, { useMemo } from 'react';
/**
 * 下载按钮 内部无状态
 * state: {
 *   0: "未下载",
 *   1: "队列中",
 *   2: "下载中",
 *   3: "已完成",
 * }
 * @param {object} props
 * @param {Boolean} props.forceDisable
 * @param {Number} props.state
 * @param {Number} props.total
 * @param {Number} props.success
 * @param {function} props.requestDownload
 */
export default function DownloadButton(props) {
    const processing = useMemo(() => props.state === 2, [props.state])
    const processBarValue = useMemo(() => 100 * props.success / props.total, [props.success])
    const btnText = useMemo(() => {
        if (props.state === 0) return "下载"
        if (props.state === 1) return "已添加"
        if (props.state === 2) return ""
        if (props.total === props.success) return "已下载"
        return `${props.total - props.success}项未完成`
    }, [props.state])

    const onClick = () => {
        if (props.forceDisable) return //禁用下载功能时 屏蔽
        if (props.state === 1 || props.state === 2) return// 队列中或者下载中 屏蔽
        props.requestDownload()
    }
    return <Button
        sx={{
            width: "100%",
            height: 42,
            padding: "0px",
            overflow: "hidden",
            backgroundColor: "button.readAndDownload.main",
            "&:hover": {
                backgroundColor: "button.readAndDownload.hover",
            },
            color: "button.readAndDownload.text",
        }}
        name='clickable'
        variant="contained"
        onClick={onClick}
    >
        {
            processing ?
                <LinearProgress
                    sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 1,
                        "& .MuiLinearProgress-bar1Buffer": {
                            backgroundColor: "button.readAndDownload.process",
                        },
                        "& .MuiLinearProgress-bar2Buffer": {
                            backgroundColor: "#button.readAndDownload.buffer"
                        },
                        "& .MuiLinearProgress-dashed": {
                            display: "none"
                        },
                        backgroundColor: "button.readAndDownload.main",
                        transition: ".5s",
                        opacity: 1,
                    }}
                    variant="buffer"
                    value={processBarValue}
                    valueBuffer={0}
                /> :

                <div style={{ opacity: 1, transition: .5 }}>
                    {btnText}
                </div>
        }
    </Button>
}
