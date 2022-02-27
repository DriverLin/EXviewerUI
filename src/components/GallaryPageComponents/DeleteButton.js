import React, { useState} from 'react';
import { Button, IconButton} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useSettingBind } from '../Settings';
import { notifyMessage} from '../utils/PopoverNotifier';

export default function DeleteButton(props) {
    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const removeFavoWhenDelete = useSettingBind("删除时移除收藏",false)
    const handelCheck = () => {
        setOpen(false);
        if (removeFavoWhenDelete === true && props.clickFavo.current !== null) {
            if (props.clickFavo.current.stause === "yes") {
                props.clickFavo.current.func()
            }
        }

        fetch(`/delete/${props.g_data.gid}_${props.g_data.token}`)
            .then(res => res.json())
            .then(data => {
                notifyMessage("success", "删除成功")
                props.disableDeleteButton();
             })
            .catch(err => { 
                notifyMessage("error", "删除失败")
                props.enableDeleteButton();
            })
    }

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


            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description" 
                sx={{
                    "& .MuiDialog-paper": {
                        color: "text.primary",
                        backgroundColor: "page.background",
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title">
                    {"确认删除?"}
                </DialogTitle>
                
                <DialogContent>
                    <DialogContentText
                        id="alert-dialog-description"
                        sx={{
                            color: "text.primary",
                        }}

                    >
                        {
                            // JSON.stringify(  )
                            props.g_data.title_jpn || props.g_data.title
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <Button
                        onClick={handelCheck}
                        variant="text"
                        startIcon={<DeleteOutlineIcon />}
                        sx={{
                            color: "#E91E63",
                        }}
                    >
                        删除
                    </Button>
                    <Button
                        onClick={handleClose}
                        variant="text"
                        startIcon={<CloseIcon />}
                        sx={{
                            color: "text.primary",
                        }}
                    >
                        取消
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
