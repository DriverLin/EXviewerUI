import React, { useRef, useState, useEffect } from 'react';
import { Button, Box, InputBase, Fab, useScrollTrigger, Paper, AppBar, Zoom, useMediaQuery, } from '@mui/material';
import { makeStyles } from '@mui/styles';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import PropTypes from 'prop-types';
import { useLocation } from "react-router-dom";
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';


// const actions = [
//     { icon: <FileCopyIcon />, name: 'Copy', onClick: () => { } },
//     { icon: <SaveIcon />, name: 'Save', onClick: () => { } },
//     { icon: <PrintIcon />, name: 'Print', onClick: () => { } },
//     { icon: <ShareIcon />, name: 'Share', onClick: () => { } },
// ];



export default function FloatAddButton(props) {
    const [open, setOpen] = React.useState(false);
    const [hidden, setHidden] = useState(false)
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const lastTop = useRef(0);
    const handelScroll = (event) => {
        if (event.e.scrollTop > lastTop.current) {
            setHidden(true)
        } else {
            setHidden(false)
        }
        lastTop.current = event.e.scrollTop;
    }
    useEffect(() => {
        window.addEventListener('vScrollEvent', handelScroll)
        return () => {
            window.removeEventListener('vScrollEvent', handelScroll)
        }
    }, [])

    return (
        <SpeedDial
            direction="up"
            ariaLabel="SpeedDial controlled open example"
            icon={<SpeedDialIcon />}
            onClose={handleClose}
            onOpen={handleOpen}
            hidden={hidden}
            open={open}
            sx={{
                position: 'absolute',
                bottom: "1rem",
                right: "1rem",
                "& .MuiSpeedDial-fab": {
                    backgroundColor: "background.main",
                    color: "text.secondary",
                },
                "& .MuiSpeedDial-fab:hover": {
                    backgroundColor: "background.main",
                    color: "text.secondary",
                }
            }}
        >
            {props.actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={() => {
                        action.onClick();
                        handleClose();
                    }}
                    sx={{
                        backgroundColor: "background.main",
                        color: "text.secondary",
                        "&.MuiSpeedDialAction-fab:hover": {
                            backgroundColor: "background.main",
                            color: "text.secondary",

                        }
                    }}
                />
            ))}
        </SpeedDial>
    )
}

