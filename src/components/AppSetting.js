
import React, { useState, useEffect, useRef } from 'react';
import SwitchType from "./AppSettingComponents/SwitchType";
import { Grid, useMediaQuery } from "@mui/material";
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
    container: {
        width: "100%",
        padding: "10px",
    },
    splitLine: {
        width: "calc(100% - 20px)",
        height: "1px",
        marginLeft: "10px",
        marginRight: "10px",
        backgroundColor: theme.palette.text.secondary,
    },
    borderCard: {
        margin: "0 auto",
        marginTop: 40,
        marginBottom: 40,
        width: 754,
        borderRadius: 20,
        color: theme.palette.background.mainCard,
        boxShadow: theme.palette.page.shadow,
        overflow: "hidden",
        padding: "10px",
    },
    matches_borderCard: {
        margin: "0 auto",
        marginBottom: 40,
        color: theme.palette.background.mainCard,
        overflow: "hidden"
    },
}));

export default function AppSetting(props) {
    const classes = useStyles();
    const matches = useMediaQuery('(min-width:800px)');

    return (
        <div className={matches ? classes.borderCard : classes.matches_borderCard}   >
            <Grid
                container
                direction="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                sx={{
                    with: "100%",
                }}
            >
                <div className={classes.container} >
                    <SwitchType name={"下载时添加收藏"} help={"下载画廊时会同步添加到收藏夹"} defaultValue={false} />
                </div>
                <div className={classes.splitLine} />
                <div className={classes.container} >
                    <SwitchType name={"删除时移除收藏"} help={"删除下载的画廊时会从收藏夹删除"} defaultValue={false} />
                </div>
            </Grid>
        </div>
    )

}
