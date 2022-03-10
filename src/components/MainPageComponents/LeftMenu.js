import React, { useState } from 'react';
import { SwipeableDrawer, List, ListItem, ListItemText, ListItemIcon, Grid } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';

export default function LeftMenu(props) {

    return (
        <SwipeableDrawer
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
                    color: "text.secondary",
                }}
            >

                <List sx={{"& .MuiListItem-button": {width: 140,}}}>
                    {
                        props.Items.map(row => (
                            <ListItem
                                button
                                name='clickable'
                                key={Math.random()}
                                onClick={() => {
                                    row.onClick();
                                    props.onClose();
                                }}

                            >
                                <ListItemIcon sx={{ color: "text.primary" }}>
                                    {row.icon}
                                </ListItemIcon>
                                <ListItemText primary={row.text} />
                            </ListItem>
                        ))
                    }
                </List>


            </Grid>
        </SwipeableDrawer>

    )
}   