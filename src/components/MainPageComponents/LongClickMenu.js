import { List, MenuItem, Popover, useMediaQuery } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import { makeStyles } from '@mui/styles';
import { useMemo } from "react";



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
    title: {
        minWidth: 280,
        margin: 14,
        fontSize: "0.93rem",
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
    }

}));








export default function LongClickMenu(props) {
    const classes = useStyles();
    const unFullScreen = useMediaQuery("(min-width:560px)")
    const open = useMemo(() => {
        return props.pos[0] > -1 && props.pos[1] > -1
    }, [props.pos])

    return (
        <Backdrop invisible={unFullScreen} open={open} onClick={() => { props.setPos([-1, -1]) }} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} >
            <Popover
                open={open}
                onClose={() => { props.setPos([-1, -1]) }}
                className={classes.menu}
                anchorReference="anchorPosition"
                anchorPosition={
                    unFullScreen ?
                        { left: props.pos[0], top: props.pos[1] }
                        :
                        { left: document.body.clientWidth / 2, top: document.body.clientHeight / 2 }
                }
                transformOrigin={
                    unFullScreen ?
                        undefined :
                        {
                            vertical: 'center',
                            horizontal: 'center',
                        }}
            >
                {
                    unFullScreen ? null :
                        <div className={classes.title}>
                            <a >{props.title}</a>
                        </div>
                }

                <List className={classes.list}  >
                    {
                        props.items.map((item, index) => <MenuItem
                            key={index}
                            className={classes.item}
                            onClick={() => {
                                item.onClick()
                                props.setPos([-1, -1])
                            }}
                        >
                            {item.icon}
                            <a>{item.text}</a>
                        </MenuItem>
                        )
                    }
                </List>
            </Popover >
        </Backdrop>
    )
}