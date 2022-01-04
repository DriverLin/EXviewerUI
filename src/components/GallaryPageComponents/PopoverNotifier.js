import React, { useState, useEffect, } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';


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