import React, { useState, useEffect, useRef } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';


const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function PopoverNotifier(props) {
    const [open, setOpen] = useState(false);
    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (props.message.message !== "") {
            setOpen(true);
        }
    }, [props.message]);

    return (


        props.message.text === "" ? null :
            <Snackbar
                open={open}
                autoHideDuration={1500}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={props.message.severity}>{props.message.text}</Alert>
            </Snackbar>
    );
}