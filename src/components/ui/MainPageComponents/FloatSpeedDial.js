import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import React, { useEffect, useRef, useState } from 'react';
import { useVisualViewport } from '../../utils/MyHooks';
import SearchIcon from '@mui/icons-material/Search';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';

export default function FloatSpeedDial(props) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true)
    };
    const handleClose = () => {
        setOpen(false)
    };

    useEffect(() => {
        if (props.hidden) {
            handleClose()
        }
    }, [props.hidden])

    const viewPort = useVisualViewport()
    useEffect(() => {
        console.log(viewPort)
    }, [viewPort])


    return <>
        <SpeedDial
            direction="up"
            ariaLabel="SpeedDial controlled open example"
            icon={<SpeedDialIcon />}
            onClose={handleClose}
            onOpen={handleOpen}
            hidden={props.hidden || props.searchFocus}
            open={open}
            sx={{
                position: 'fixed',
                top: viewPort.height - (72 + 56 * props.actions.length) - 16,
                right: 16,
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

        <Zoom
            in={props.searchFocus}
            unmountOnExit
        >
            <Fab
                onClick={props.doSearch}
                sx={{
                    position: 'fixed',
                    top: viewPort.height - 56 - 16,
                    right: 16,
                    backgroundColor: "background.main",
                    color: "text.secondary",
                    "&:hover": {
                        backgroundColor: "background.main",
                        color: "text.secondary",
                    }
                }}
            >
                <SearchIcon />
            </Fab>
        </Zoom>

    </>
}

