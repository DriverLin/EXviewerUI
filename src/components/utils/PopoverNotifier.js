import React, { useState, useEffect, } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const notifyMessage = (severity, text) => {
    console.log(severity, text)
    const messageEvent = new Event("PopoverNotifierMessage");
    messageEvent.severity = severity;
    messageEvent.text = text;
    window.dispatchEvent(messageEvent);
}


export default function PopoverNotifier(props) {
    const [open, setOpen] = useState(false);
    const handleClose = () => {
        setOpen(false);
    };
    const [notifyMessage, setNotifyMessage] = useState(null)
    
    const msgHandler = (msg) => {
        setOpen(true);
        setNotifyMessage(msg)
    }
    
    useEffect(() => {
        window.addEventListener('PopoverNotifierMessage', msgHandler);
        return () => {
            window.removeEventListener('PopoverNotifierMessage', msgHandler);
        }
    }, []);

    return (
        notifyMessage === null ? null :
            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notifyMessage.severity}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'left',
                    }}  >
                        {
                            typeof notifyMessage.text === "string" ?
                                <a>{notifyMessage.text}</a>
                                :
                                notifyMessage.text.map((item, index) => <a key={index}>{item}</a>)
                        }
                    </div>
                </Alert>
            </Snackbar>
    );
}