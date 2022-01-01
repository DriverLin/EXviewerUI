import React, { useState} from 'react';
import { Button, IconButton} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';


export default function DeleteButton(props) {

    const [open, setOpen] = useState(false);
    
    
    
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handelCheck = () => {
        setOpen(false);
        fetch(`/delete/${props.g_data.gid}_${props.g_data.token}`)
            .then(res => res.json())
            .then(data => {
                props.setNotifyMessage(
                    {
                        severity: "success",
                        text: "已发送删除信号"
                    }
                )
                props.disableDeleteButton();
             })
            .catch(err => { 
                props.setNotifyMessage(
                    {
                        severity: "error",
                        text: "删除失败"
                    }
                )
                props.enableDeleteButton();
            })
    }

    return (
        <div>
            <IconButton
                disabled={props.forceControlDisabled}
                onClick={handleClickOpen}
                sx={{
                    // opacity: initOpacity,
                    transition: ".5s",
                    color: "#ffffff",
                    "&.Mui-disabled": {
                        color: "#757575",
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
                        color: "#ffffff",
                        backgroundColor: "#303030",
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
                            color: "#ffffff",
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
                            color: "#ffffff",
                        }}
                    >
                        取消
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
