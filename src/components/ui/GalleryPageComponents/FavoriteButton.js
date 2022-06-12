
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { IconButton } from '@mui/material';
import React from 'react';

const NotFavorite = (props) => {
    return <IconButton
        name='clickable'
        onClick={props.onClick}
        sx={{
            transition: ".5s",
            color: "button.iconFunction.main",
        }}
        component="span"
    >
        <FavoriteBorderIcon fontSize="large" />
    </IconButton>
}

const Fetching = () => {
    return <IconButton
        sx={{
            transition: ".5s",
            color: "button.iconFunction.disabled",
        }}
        component="span"
    >
        <FavoriteIcon fontSize="large" />
    </IconButton>
}

const FavoriteAdded = (props) => {
    return <IconButton
        name='clickable'
        onClick={props.onClick}
        sx={{
            transition: ".5s",
            color: "button.iconFunction.main",
        }}
        component="span"
    >
        <FavoriteIcon fontSize="large" />
    </IconButton>
}

/**
 * 收藏按钮
 * 可强制禁用
 * state {
 *  0:未收藏
 *  1:请求添加中
 *  2:已收藏
 *  3:无法操作
 * }
 * @param {object} props
 * @param {Boolean} props.forceDisable
 * @param {object} props.state  
 * @param {function} props.onAdd
 * @param {function} props.onRemove
 */
export default function FavoriteButton(props) {
    const onClick = () => {
        if (props.state === 0) {
            props.onAdd()
        } else if (props.state === 2) {
            props.onRemove()
        } else {
            //忽略
        }
    }
    return <div>
        {props.forceDisable ? <NotFavorite onClick={() => { }} /> : null}
        {!props.forceDisable && props.state === 0 ? <NotFavorite onClick={onClick} /> : null}
        {!props.forceDisable && props.state === 1 ? <Fetching onClick={onClick} /> : null}
        {!props.forceDisable && props.state === 2 ? <FavoriteAdded onClick={onClick} /> : null}
        {!props.forceDisable && props.state === 3 ? <NotFavorite onClick={() => { }} /> : null}
    </div>
}