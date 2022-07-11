import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useEventListener } from 'ahooks';
import React, { useState } from 'react';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const notifyMessage = (severity, msg) => {
    const messageEvent = new Event("PopoverNotifierMessage");
    messageEvent.severity = severity;
    messageEvent.text = msg;
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


    useEventListener('PopoverNotifierMessage', msgHandler);

    return (
        notifyMessage === null ? null :
            <Snackbar
                open={open}
                autoHideDuration={1500}
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
                            notifyMessage.text.map((item, index) => <a key={item}>{item}</a>)
                        }
                    </div>
                </Alert>
            </Snackbar>
    );
}