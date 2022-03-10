import { Grid, List, ListItem, ListItemIcon, ListItemText, SwipeableDrawer } from '@mui/material';
import React from 'react';

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