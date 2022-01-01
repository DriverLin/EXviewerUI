import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, Paper, Grid, Snackbar, Rating, Alert, useMediaQuery, Card, Typography, Box, ButtonBase } from '@mui/material';
import { styled, makeStyles, withStyles } from '@mui/styles';
import { useLocation, NavLink } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IosShareIcon from '@mui/icons-material/IosShare';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';


export default function DeleteButton(props) {

    const [open, setOpen] = useState(false);
    const [disabled, setDisabled] = useState(  !props.g_data.hasOwnProperty('extended') || props.g_data.extended.downloaded === false);
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
                        text: "Deleted Successfully"
                    }
                )
                setDisabled(true);
             })
            .catch(err => { 
                props.setNotifyMessage(
                    {
                        severity: "error",
                        text: "Deleted Failed"
                    }
                )
                setDisabled(false);
            })
    }

    return (
        <div>
            <IconButton
                disabled={disabled}
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
