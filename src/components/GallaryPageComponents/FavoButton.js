

//先说明设计思路
//由于cache设计为3秒 所以只要不是太短就会一直是最新的
//重新设计接口 让其处于full状态且不是离线模式的时候 使用参数 强制获取最新数据
//如果是离线模式 则收藏按钮为禁用状态
import React, { useState, useRef } from 'react';
import { IconButton} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function FavoButton(props) {
    let initfavoStause = "null"
    if (props.g_data.hasOwnProperty('extended')) {
        if (props.g_data.extended.favo === " Add to Favorites") {
            initfavoStause = "no"
        } else {
            initfavoStause = "yes"
        }
    }
    const [stause, setStause] = useState(initfavoStause)
    // const [stause, setStause] = useState("no")
    // const [stause, setStause] = useState("yes")
    // const [stause, setStause] = useState("fetching")

    const lock = useRef(false)
    const onClick = () => {
        if (lock.current === true) return;
        lock.current = true;

        let url = null
        let successStause = null
        let failedStause = null
        if (stause === "yes") {
            url = `/rmfavo/${props.g_data.gid}_${props.g_data.token}`
            successStause = "no"
            failedStause = "yes"
        } else if (stause === "no") {
            url = `/addfavo/${props.g_data.gid}_${props.g_data.token}/9`
            successStause = "yes"
            failedStause = "no"
        } else return
        setStause("fetching")

        setTimeout(() => {
            fetch(url).then(res => res.json()).then(data => {
                lock.current = false;
                if (data.msg === "success") {
                    setStause(successStause)
                } else {
                    setStause(failedStause)
                }
            }).catch(err => {
                lock.current = false;
                setStause(failedStause)
                console.log("FavoButton error", err)
            })
        }, 500)


    }


    const elemMap = {
        "null":
            <IconButton
                disabled={true}
                onClick={() => { }}
                sx={{
                    "&.Mui-disabled": {
                        color: "iconButton.disabled",
                    },
                }}
                component="span"
            >
                <FavoriteBorderIcon fontSize="large" />
            </IconButton>,
        "no":
            <IconButton
                onClick={onClick}
                sx={{
                    transition: ".5s",
                    color: "iconButton.main",
                }}
                component="span"
            >
                <FavoriteBorderIcon fontSize="large" />
            </IconButton>,
        "yes":
            <IconButton
                onClick={onClick}
                sx={{
                    transition: ".5s",
                    color: "iconButton.main",
                }}
                component="span"
            >
                <FavoriteIcon fontSize="large" />
            </IconButton>,
        "fetching":
            <IconButton
                sx={{
                    transition: ".5s",
                    color: "iconButton.disabled",
                }}
                component="span"
            >
                <FavoriteIcon fontSize="large" />
            </IconButton>,
    }

    return elemMap[stause]

}