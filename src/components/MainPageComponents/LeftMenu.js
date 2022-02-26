import React, { useState } from 'react';
import { SwipeableDrawer, List, ListItem, ListItemText, ListItemIcon, Grid } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';

export default function LeftMenu(props) {
    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <SwipeableDrawer
            disableBackdropTransition={!iOS}
            disableDiscovery={iOS}
            anchor={"left"}
            open={props.open}
            onOpen={() => { }}
            onClose={props.onClose}
        >
            <Grid
                container
                direction="column"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{
                    height: "100%",
                    backgroundColor: 'page.background',
                    color:"text.secondary",
                }}
            >

                <List >
                    {
                        props.Items.slice(0, props.Items.length-1).map(row => (
                            <ListItem
                                button
                                name='clickable'
                                key={Math.random()}
                                onClick={() => {
                                    row.onClick();
                                    props.onClose();
                                }} >
                                <ListItemIcon
                                    sx={{
                                        color: "text.primary"
                                    }}
                                >
                                    {row.icon}
                                </ListItemIcon>
                                <ListItemText primary={row.text} />
                            </ListItem>
                        ))
                    }
                </List>

                <ListItem
                    button
                    name='clickable'
                    key={Math.random()}
                    onClick={() => {
                        props.Items[props.Items.length-1].onClick();
                        props.onClose();
                    }} >
                    <ListItemIcon
                        sx={{
                            color: "text.primary"
                        }}
                    >
                        {props.Items[props.Items.length - 1].icon}
                    </ListItemIcon>
                    <ListItemText primary={props.Items[props.Items.length - 1].text} />
                </ListItem>

            </Grid>
        </SwipeableDrawer>

    )
}   