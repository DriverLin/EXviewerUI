
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Button, Grow } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';




export default function SecondConfirmDialog(props) {

    return props.open ? <Dialog
        open={props.open}
        onClose={props.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        TransitionComponent={Grow }
        transitionDuration={300}
        sx={{
            "& .MuiDialog-paper": {
                color: "text.primary",
                backgroundColor: "page.background",
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
                    color: "text.primary",
                }}

            >
                {
                    props.title
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
                onClick={props.onConfirm}
                variant="text"
                startIcon={<DeleteOutlineIcon />}
                sx={{
                    color: "#E91E63",
                }}
            >
                删除
            </Button>
            <Button
                onClick={props.handleClose}
                variant="text"
                startIcon={<CloseIcon />}
                sx={{
                    color: "text.primary",
                }}
            >
                取消
            </Button>
        </DialogActions>
    </Dialog> : null
}