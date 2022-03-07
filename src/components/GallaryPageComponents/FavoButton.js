

//先说明设计思路
//由于cache设计为3秒 所以只要不是太短就会一直是最新的
//重新设计接口 让其处于full状态且不是离线模式的时候 使用参数 强制获取最新数据
//如果是离线模式 则收藏按钮为禁用状态
import React, { useState, useRef, useEffect } from 'react';
import { IconButton } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { dispathStateStorage } from '../utils/StateSync';
import { useSettingBind } from '../utils/Settings';
import { addFavo, rmFavo, testAction, useActionHandeler, useSyncState } from '../utils/GlobalActionHandeler';

export default function FavoButton(props) {
    const favoIndex = useSettingBind("收藏夹", 9)
    let initfavoStause = "null"//没有扩展数据 无法管理收藏 收藏按钮直接为禁用
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
        if (stause === "yes") {
            setStause("fetching")
            rmFavo(props.g_data.gid, props.g_data.token)
        } else if (stause === "no") {
            setStause("fetching")
            addFavo(props.g_data.gid, props.g_data.token, favoIndex)
        } else return

    }
    useActionHandeler((result) => {
        if (result.gid !== props.g_data.gid) return
        if (result.success) {
            setStause("yes")
        }
        lock.current = false
    }, ["addFavo"])
    useActionHandeler((result) => {
        if (result.gid !== props.g_data.gid) return
        if (result.success) {
            setStause("no")
        }
        lock.current = false
    }, ["rmFavo"])

    const wsSyncState = useSyncState()
    useEffect(() => {
        if (Object.keys(wsSyncState).length === 0) return
        const testState = wsSyncState[props.g_data.gid]
        if (testState) {
            setStause((testState[1] > -1) ? "yes" : "no")
        }
    }, [wsSyncState])


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