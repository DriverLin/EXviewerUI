import React, { useState } from 'react';
import { SwipeableDrawer, List, ListItem, ListItemText, ListItemIcon, Grid } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';

export default function LeftMenu(props) {
    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);

    const modeIcons = [<DarkModeIcon />, <Brightness4Icon />, <BrightnessAutoIcon />]
    const modeTexts = ['深色模式', '浅色模式', '自动']

    let initColorMode = 0;
    if (localStorage.hasOwnProperty('colorMode')) {
        const index = modeTexts.indexOf(localStorage.getItem('colorMode'))
        initColorMode = index === -1 ? 0 : index
    }


    const [modeIndex, setModeIndex] = useState(initColorMode);


    const switchBetweenLightAndDark = () => {
        const newIndex = (modeIndex + 1) % 3
        setModeIndex(newIndex)
        localStorage.setItem('colorMode', modeTexts[newIndex])
        var myEvent = new CustomEvent('userDispatchColorModeEvent', {
            detail: { context: 'modeChanged' },
        });
        if (window.dispatchEvent) {
            window.dispatchEvent(myEvent);
        } else {
            window.fireEvent(myEvent);
        }
    }

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
                        props.Items.map(row => (

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
                <ListItem button onClick={switchBetweenLightAndDark} >
                    <ListItemIcon sx={{
                        color: "text.primary"
                    }}>
                        {modeIcons[modeIndex]}
                    </ListItemIcon>
                    <ListItemText primary={modeTexts[modeIndex]} />
                </ListItem>
            </Grid>



        </SwipeableDrawer>

    )
}   