

//先说明设计思路
//由于cache设计为3秒 所以只要不是太短就会一直是最新的
//重新设计接口 让其处于full状态且不是离线模式的时候 使用参数 强制获取最新数据
//如果是离线模式 则收藏按钮为禁用状态
import React, { useState, useRef,useEffect } from 'react';
import { IconButton} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { dispathStateStorage } from '../utils/StateSync';
export default function FavoButton(props) {
    let initfavoStause = "null"
    if (props.g_data.hasOwnProperty('extended')) {
        if (props.g_data.extended.favo > -1) {
            initfavoStause = "yes"
        } else {
            initfavoStause = "no"
        }
    }
    const [stause, setStause] = useState(initfavoStause)
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
                    let prevStause = JSON.parse(localStorage.getItem(props.g_data.gid) || '[false,-1,-2]')
                    prevStause[1] = successStause === "yes" ? 9 : -1
                    dispathStateStorage(props.g_data.gid, JSON.stringify(prevStause))
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
    useEffect(() => {
        props.setClickFavo(
            {
                stause: stause,
                func: onClick
            }
        )
    }, [stause])


    const elemMap = {
        "null":
            <IconButton
                disabled={true}
                onClick={() => { }}
                sx={{
                    "&.Mui-disabled": {
                        color: "button.iconFunction.disabled",
                    },
                }}
                component="span"
            >
                <FavoriteBorderIcon fontSize="large" />
            </IconButton>,
        "no":
            <IconButton
                name='clickable'
                onClick={onClick}
                sx={{
                    transition: ".5s",
                    color: "button.iconFunction.main",
                }}
                component="span"
            >
                <FavoriteBorderIcon fontSize="large" />
            </IconButton>,
        "yes":
            <IconButton
                name='clickable'

                onClick={onClick}
                sx={{
                    transition: ".5s",
                    color: "button.iconFunction.main",
                }}
                component="span"
            >
                <FavoriteIcon fontSize="large" />
            </IconButton>,
        "fetching":
            <IconButton
                sx={{
                    transition: ".5s",
                    color: "button.iconFunction.disabled",
                }}
                component="span"
            >
                <FavoriteIcon fontSize="large" />
            </IconButton>,
    }

    return elemMap[stause]

}