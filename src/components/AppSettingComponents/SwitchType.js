//开关类型

import { useSetting } from "../utils/Settings"
import { Button, Grid, Switch } from "@mui/material";
import { makeStyles } from '@mui/styles';
import { useEffect } from "react";




const useStyles = makeStyles((theme) => ({
    name_container: {
        minHeight: "35px",
        textAlign: "left",
        display: "grid",
    },
    name_text: {
        color: theme.palette.text.primary,
        fontSize: "1rem",
    },
    help: {
        color: theme.palette.text.secondary,
        fontSize: "0.85rem",
    }
}));


export default function SwitchType(props) {
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