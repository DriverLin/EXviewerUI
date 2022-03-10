import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { IconButton } from '@mui/material';
import React, { useState } from 'react';
import { rmDownload, rmFavo, useActionHandeler } from '../utils/GlobalActionHandeler';
import { notifyMessage } from '../utils/PopoverNotifier';
import SecnodConfirmDialog from '../utils/SecnodConfirmDialog';
import { useSettingBind } from '../utils/Settings';


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
