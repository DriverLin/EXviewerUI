import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Grow from '@mui/material/Grow';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';
import { useSetting } from '../utils/Settings';




const Transition = React.forwardRef(function Transition(props, ref) {
    return <Grow direction="up" ref={ref} {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

const BootstrapDialogTitle = (props) => {
    const { children, onClose, ...other } = props;

    return (
        <DialogTitle sx={{ m: 0, p: 2, backgroundColor: "page.background" }} {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.primary.main,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
};

BootstrapDialogTitle.propTypes = {
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
};

export default function ViewSettingPanel(props) {
    const [horizontalView, setHorizontalView] = useSetting("横屏模式", false);
    const [switchPagination, setSwitchPagination] = useSetting("分页模式", false);
    const [switchDirection, setSwitchDirection] = useSetting("阅读方向", true);

    return (
        <div>
            <BootstrapDialog
                TransitionComponent={Transition}
                onClose={props.onClose}
                aria-labelledby="customized-dialog-title"
                open={props.open}
                sx={{
                    "& .MuiDialog-paper": {
                        backgroundColor: "page.background",
                    },
                }}
            >
                <BootstrapDialogTitle id="customized-dialog-title" onClose={props.onClose}>
                    阅读设置
                </BootstrapDialogTitle>
                <List
                    sx={{
                        width: '100%',
                        maxWidth: 360,
                        backgroundColor: 'page.background',
                        color: "text.primary",
                    }}
                >
                    <ListItem>
                        <ListItemIcon>
                            <ScreenRotationIcon color='primary' />
                        </ListItemIcon>
                        <ListItemText primary="横屏模式" />
                        <Switch
                            edge="end"
                            onChange={ () =>  setHorizontalView(!horizontalView)}
                            checked={horizontalView}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-wifi',
                            }}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <ViewColumnIcon color='primary' />
                        </ListItemIcon>
                        <ListItemText primary="切换分页" />
                        <Switch
                            edge="end"
                            onChange={ () =>  setSwitchPagination(!switchPagination)}
                            checked={switchPagination}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-wifi',
                            }}
                        />
                    </ListItem>


                    <ListItem>
                        <ListItemIcon>
                            <MenuBookIcon color='primary' />
                        </ListItemIcon>
                        <ListItemText primary="切换方向" />
                        <Switch
                            edge="end"
                            onChange={ () =>  setSwitchDirection(!switchDirection)}
                            checked={switchDirection}
                            inputProps={{
                                'aria-labelledby': 'switch-list-label-wifi',
                            }}
                        />
                    </ListItem>

                    
                    <ListItem>
                        {/* <ListItemIcon>
                        <ScreenRotationIcon />
                    </ListItemIcon> */}
                        {/* <ListItemText primary="重置设置" /> */}
                        <Button sx={{ width: "100%" }} variant="contained" startIcon={<RestartAltIcon />}
                            onClick={() => {
                                setHorizontalView(false);
                                setSwitchPagination(false);
                                setSwitchDirection(true);
                                props.onClose();
                            }}
                        >
                            重置设置
                        </Button>
                    </ListItem>
                </List>
            </BootstrapDialog>
        </div>
    );
}
