import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import React, { useEffect, useRef, useState } from 'react';


export default function FloatSpeedDial(props) {
    const [open, setOpen] = useState(false);
    // const [hidden, setHidden] = useState(false)


    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(() => {
        if (props.hidden) {
            handleClose()
        }
    }, [props.hidden])

    return (
        <SpeedDial
            direction="up"
            ariaLabel="SpeedDial controlled open example"
            icon={<SpeedDialIcon />}
            onClose={handleClose}
            onOpen={handleOpen}
            hidden={props.hidden}
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

