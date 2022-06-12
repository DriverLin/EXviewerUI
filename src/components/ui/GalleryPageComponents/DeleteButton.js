import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { IconButton } from '@mui/material';
import React, { useMemo, useState } from 'react';
import SecondConfirmDialog from '../../utils/SecondConfirmDialog';


/**
 * 删除按钮
 * 点击弹出确认面板 确认删除后调用外部API函数
 * 是否可点击由外部状态控制 因此服务器状态设计一定要完善
 * @param {object} props
 * @param {Number} props.gid
 * @param {String} props.token
 * @param {Boolean} props.forceDisable
 * @param {Boolean} props.canDelete
 * @param {String} props.title
 * @param {function} props.requestDelete
 * 
 */
export default function DeleteButton(props) {
    const [open, setOpen] = useState(false);
    const handleClickOpen = () => { setOpen(true); };
    const handleClose = () => { setOpen(false); };
    const handelCheck = () => {
        setOpen(false);
        props.requestDelete(props.gid, props.token);
    }
    const disabled = useMemo(() => {
        if(props.forceDisable) return true
        return !props.canDelete
    }, [props.canDelete, props.forceDisable])
    return (
        <div>
            <IconButton
                name='clickable'
                disabled={disabled}
                onClick={handleClickOpen}
                sx={{
                    transition: ".5s",
                    color: "button.iconFunction.main",
                    "&.Mui-disabled": {
                        color: "button.iconFunction.disabled",
                    },
                }}
                component="span"
            >
                <DeleteOutlineIcon fontSize="large" />
            </IconButton>
            <SecondConfirmDialog
                open={open}
                handleClose={handleClose}
                onConfirm={handelCheck}
                title={props.title}
            />
        </div>
    );
}
