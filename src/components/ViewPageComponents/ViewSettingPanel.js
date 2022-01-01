import React, { useState,} from 'react';

import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import MenuBookIcon from '@mui/icons-material/MenuBook';

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
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose ? (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
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
    const [checked, setChecked] = useState(
        JSON.parse(localStorage.getItem("global_viewingSettings")) || {
            "横屏模式": false,
            "切换分页": false,
            "切换方向":true,
        }
    );

const handleToggle = (value) => () => {
    // console.log("handleToggle",value);
    const newChecked = { ...checked };
    newChecked[value] = !checked[value];
    // console.log("newChecked",newChecked);
    setChecked(newChecked);
    localStorage.setItem('global_viewingSettings', JSON.stringify(newChecked));
};

return (
    <div>
        <BootstrapDialog
            onClose={props.onClose}
            aria-labelledby="customized-dialog-title"
            open={props.open}
        >
            <BootstrapDialogTitle id="customized-dialog-title" onClose={props.onClose}>
                菜单
            </BootstrapDialogTitle>
            <List
                sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
            // subheader={<ListSubheader>Settings</ListSubheader>}
            >
                <ListItem>
                    <ListItemIcon>
                        <ScreenRotationIcon />
                    </ListItemIcon>
                    <ListItemText primary="横屏模式" />
                    <Switch
                        edge="end"
                        onChange={handleToggle('横屏模式')}
                        checked={checked['横屏模式']}
                        inputProps={{
                            'aria-labelledby': 'switch-list-label-wifi',
                        }}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <ViewColumnIcon />
                    </ListItemIcon>
                    <ListItemText primary="切换分页" />
                    <Switch
                        edge="end"
                        onChange={handleToggle('切换分页')}
                        checked={checked['切换分页']}
                        inputProps={{
                            'aria-labelledby': 'switch-list-label-wifi',
                        }}
                    />
                </ListItem>


                <ListItem>
                    <ListItemIcon>
                        <MenuBookIcon />
                    </ListItemIcon>
                    <ListItemText primary="切换方向" />
                    <Switch
                        edge="end"
                        onChange={handleToggle('切换方向')}
                        checked={checked['切换方向']}
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
                            localStorage.setItem('global_viewingSettings', JSON.stringify({
                                "横屏模式": false,
                                "切换分页": false,
                                "切换方向":true,
                            }))
                            setChecked({
                                "横屏模式": false,
                                "切换分页": false,
                                "切换方向": true,

                            })
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
