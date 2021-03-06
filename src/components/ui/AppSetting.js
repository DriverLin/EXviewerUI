
import { Grid, useMediaQuery, Button, Switch, List, Menu, MenuItem } from "@mui/material";
import { makeStyles } from '@mui/styles';
import React, { useEffect, useState } from 'react';
import { fetchDiskCacheSize, requestClearDiskCache } from "../api/serverApi";
import { notifyMessage } from "../utils/PopoverNotifier";
import { useSetting } from "../utils/SettingHooks";



const useStyles = makeStyles((theme) => ({
    item: {
        height: "45px",
        "& a": {
            margin: "5px 10px 5px 10px",
        },

        "&.MuiMenuItem-root": {
            backgroundColor: theme.palette.background.main,
        },
        "&.MuiMenuItem-root.Mui-selected": {
            backgroundColor: theme.palette.background.main,
        },
        "&.MuiMenuItem-root.Mui-selected:hover": {
            backgroundColor: theme.palette.background.main,
        },
        "&.MuiMenuItem-root:hover": {
            backgroundColor: theme.palette.background.main,
        }
    },
    list: {
        "&.MuiList-root": {
            backgroundColor: theme.palette.background.main,
        },
    },
    menu: {
        "& .MuiList-root": {
            backgroundColor: theme.palette.background.main,
            padding: 0,
            borderRadius: 0,
        },
        "& .MuiPaper-root": {

            borderRadius: 5,
            backgroundColor: theme.palette.background.main,
        }
    },
    name_text: {
        color: theme.palette.text.primary,
        fontSize: "1rem",
    },
    help: {
        color: theme.palette.text.secondary,
        fontSize: "0.85rem",
    },
    name_container: {
        minHeight: "35px",
        textAlign: "left",
        display: "grid",
    },



    splitLine: {
        width: "calc(100% - 40px)",
        height: "1px",
        marginLeft: "20px",
        marginRight: "20px",
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
    },
    matches_borderCard: {
        margin: "0 auto",
        marginBottom: 40,
        paddingBottom: "20px",
        color: theme.palette.background.mainCard,
        overflow: "hidden",
    },
}));



function SelectType(props) {
    const [value, setValue] = useSetting(props.name, props.defaultValue);
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (e) => { setAnchorEl(e.currentTarget); };
    const handleClose = () => { setAnchorEl(null) };
    const onSelect = (value) => {
        setValue(value);
        handleClose()
    }
    return (
        <div>
            <Button
                onClick={handleClick}
                sx={{
                    height: "75px",
                    padding: "10px 20px 10px 20px",
                    borderRadius: "0px",
                    width: "100%",
                    color: "text.primary",
                    "&:hover": {
                        backgroundColor: "#00000000",
                    }
                }}
            >
                <Grid
                    container
                    direction="column"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Grid item>
                        <div className={classes.name_text}>
                            <a>{props.name}</a>
                        </div>
                    </Grid>
                    {
                        props.help ?
                            <Grid item>
                                <div className={classes.help}>
                                    <a>{props.help(value)}</a>
                                </div>
                            </Grid>
                            :
                            null
                    }
                </Grid>
            </Button>
            <Menu
                open={open}
                onClose={handleClose}
                className={classes.menu}
                anchorEl={anchorEl}
            >
                <List className={classes.list}  >
                    {
                        props.values.map((item, index) => <MenuItem
                            key={index}
                            className={classes.item}
                            onClick={() => onSelect(item)}
                        >
                            <a>{item}</a>
                        </MenuItem>)
                    }
                </List>
            </Menu>
        </div>
    )
}
function SwitchType(props) {
    const classes = useStyles();
    const [value, setValue] = useSetting(props.name, props.defaultValue);
    return (
        <Button
            sx={{
                height: "75px",
                padding: "10px 20px 10px 20px",
                borderRadius: "0px",
                width: "100%",
                color: "text.primary",
                "&:hover": {
                    backgroundColor: "#00000000",
                }
            }}
            onClick={() => setValue(!value)}
        >
            <Grid
                container
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                    width: "100%",
                }}
            >
                <Grid item >
                    <Grid
                        container
                        direction="column"
                        justifyContent="space-between"
                        alignItems="flex-start"
                    >
                        <Grid item>
                            <div className={classes.name_text}>
                                <a>{props.name}</a>
                            </div>
                        </Grid>
                        {
                            props.help ?
                                <Grid item>
                                    <div className={classes.help}>
                                        <a>{props.help(value)}</a>
                                    </div>
                                </Grid>
                                :
                                null
                        }
                    </Grid>
                </Grid>
                <Grid item >
                    <Switch
                        edge="end"
                        checked={value}
                        inputProps={{
                            'aria-labelledby': 'switch-list-label-wifi',
                        }}
                    />
                </Grid>
            </Grid>
        </Button>
    )
}


function ClearDiskCache() {
    const classes = useStyles();
    const [cacheSize, setCacheSize] = useState(0);

    const getDiskCacheSize = async () => {
        const [data, error] = await fetchDiskCacheSize();
        if (error) {
            notifyMessage("error", error)
        } else {
            setCacheSize(data["msg"]);
        }
    }
    const clearDiskCache = async () => {
        const [data, error] = await requestClearDiskCache();
        if (error) {
            notifyMessage("error", error)
        } else {
            setCacheSize("?????????" + data["msg"]);
        }
    }

    useEffect(() => {
        getDiskCacheSize()
    }, [])


    return <Button
        sx={{
            height: "75px",
            padding: "10px 20px 10px 20px",
            borderRadius: "0px",
            width: "100%",
            color: "text.primary",
            "&:hover": {
                backgroundColor: "#00000000",
            }
        }}
        onClick={clearDiskCache}
    >
        <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
                width: "100%",
            }}
        >
            <Grid item >
                <Grid
                    container
                    direction="column"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Grid item>
                        <div className={classes.name_text}>
                            <a>{"????????????"}</a>
                        </div>
                    </Grid>

                </Grid>
            </Grid>
            <Grid item >
                <a>{cacheSize}</a>
            </Grid>
        </Grid>
    </Button>
}
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
                <Grid item xs={12} sx={{ width: "100%" }} >
                    <SwitchType
                        name={"?????????????????????"}
                        defaultValue={false}
                        help={(value) => value ? "?????????????????????????????????" : "????????????????????????????????????"}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SwitchType
                        name={"?????????????????????"}
                        defaultValue={false}
                        help={(value) => value ? "????????????????????????????????????" : "???????????????????????????????????????"}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SelectType
                        name={"????????????"}
                        defaultValue={"??????"}
                        values={["????????????", "??????", "??????"]}
                        help={(value) => `${value}`}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SelectType
                        name={"???????????????"}
                        defaultValue={7}
                        values={[0, 3, 5, 7, 11, 13, 17]}
                        help={(value) => `???????????????${value}?????????`}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SelectType
                        name={"?????????"}
                        defaultValue={9}
                        values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                        help={(value) => `???????????????${value}`}
                    />
                </Grid>


                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SwitchType
                        name={"??????????????????"}
                        defaultValue={false}
                        help={(value) => value ? "??????????????????????????????????????????" : "?????????????????????????????????"}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <ClearDiskCache />
                </Grid>

            </Grid>
        </div>
    )

}
