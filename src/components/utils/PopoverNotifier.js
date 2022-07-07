import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useEventListener } from 'ahooks';
import React, { useState } from 'react';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const notifyMessage = (severity, msg) => {
    console.log(severity, msg)
    let showMsg = ''
    if(Array.isArray(msg)){
        showMsg = msg.join('\n')
    }else if (typeof msg === 'object') {
        showMsg = JSON.stringify(msg)
    }else if (typeof msg === 'string') {
        showMsg = msg
    }else{
        showMsg = 'unknown msg type'
    }
    const messageEvent = new Event("PopoverNotifierMessage");
    messageEvent.severity = severity;
    messageEvent.text = showMsg;
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