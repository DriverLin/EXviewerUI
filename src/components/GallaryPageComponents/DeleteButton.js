import React, { useState } from 'react';
import { Button, IconButton } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useSettingBind } from '../utils/Settings';
import { notifyMessage } from '../utils/PopoverNotifier';
import { rmDownload, rmFavo, useActionHandeler } from '../utils/GlobalActionHandeler';
import SecnodConfirmDialog from '../utils/SecnodConfirmDialog';
export default function DeleteButton(props) {
    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const removeFavoWhenDelete = useSettingBind("删除时移除收藏", false)
    const handelCheck = () => {
        setOpen(false);
        if (removeFavoWhenDelete) {
            rmFavo(props.g_data.gid, props.g_data.token)
        }
        rmDownload(props.g_data.gid, props.g_data.token)
    }

    useActionHandeler((result) => {
        if (result.gid !== props.g_data.gid) return
        if (result.success) {
            notifyMessage("success", "删除成功")
            props.disableDeleteButton();
        }
    }, ["rmDownload"])



    return (
        <div>
            <IconButton
                name='clickable'
                disabled={props.forceControlDisabled}
                onClick={handleClickOpen}
                sx={{
                    // opacity: initOpacity,
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
            <SecnodConfirmDialog open={open} handleClose={handleClose} onConfirm={handelCheck} title={props.g_data.title_jpn || props.g_data.title} />
        </div>
    );
}
