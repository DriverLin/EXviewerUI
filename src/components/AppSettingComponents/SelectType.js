import { useSetting } from "../utils/Settings";
import { useMemo, useState } from "react";
import { Select, FormControl, MenuItem, InputLabel, Box, List, Menu, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

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
    }

}));
export default function SelectType(props) {
    const [value, setValue] = useSetting(props.name, props.defaultValue);
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null)
    };

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