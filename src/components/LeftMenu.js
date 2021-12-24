import React, { useState, useEffect, useRef } from 'react';
import { SwipeableDrawer, List, ListItem, ListItemText, ListItemIcon} from '@mui/material';
import { makeStyles } from '@mui/styles';

export default function LeftMenu(props) {
    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    return (
        <SwipeableDrawer
            disableBackdropTransition={!iOS}
            disableDiscovery={iOS}
            anchor={"left"}
            open={props.open}
            onClose={props.onClose}
        >
            <List>
                {
                    props.Items.map(row => (
                        <ListItem key={Math.random()} button onClick={() => {
                            row.onClick();
                            props.onClose();
                        }} >
                            <ListItemIcon>
                                {row.icon}
                            </ListItemIcon>
                            <ListItemText primary={row.text} />
                        </ListItem>
                    ))
                }
            </List>

        </SwipeableDrawer>

    )
}   