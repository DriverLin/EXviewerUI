import React, { useState, useEffect, useRef } from 'react';
import { InputBase, ButtonBase, useScrollTrigger, Paper, AppBar, Toolbar, Slide, useMediaQuery } from '@mui/material';
import { makeStyles } from '@mui/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PropTypes from 'prop-types';


function HideOnScroll(props) {
    const { children, window } = props;
    const trigger = useScrollTrigger({ target: window ? window() : undefined });
    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {children}
        </Slide>
    );
}

HideOnScroll.propTypes = {
    children: PropTypes.element.isRequired,
    window: PropTypes.func,
};


export default function TopSearchBar(props) {
    const matches = useMediaQuery('(min-width:830px)')
    const defaultSearch = decodeURIComponent(window.location.search.replace("?f_search=", "")) 
    const useStyles = makeStyles((theme) => ({
        inputRoot: {
            color: 'inherit',
            width: matches ? 630 : document.body.clientWidth - 160,
        },
        inputInput: {
        },
        drawer: {
            width: "100%",
            flexShrink: 0,
        },
        drawerPaper: {
            width: "100%",
        },
        topbarButton: {
            width: 50,
            height: 50
        },
        topBarPaper: {
            height: 50,
            // width: 900,
            margin: "0 auto"
        }
    }));
    const classes = useStyles();

    const searchValueRef = useRef(defaultSearch);

    const updateSearchValue = (e) => { 
        searchValueRef.current = e.target.value;
    }
    const doSearch = () => {
        // console.log("searching for: " + searchValueRef.current);
        props.doSearch(searchValueRef.current)
    }

    return (
        <HideOnScroll {...props}>
            <AppBar style={{
                marginTop: 22,
                backgroundColor: "#00000000",
                boxShadow: "None"
            }}>
                <Toolbar>
                    <Paper className={classes.topBarPaper}>
                        
                        <ButtonBase className={classes.topbarButton} onClick={props.leftButtonClick} >
                            <MenuIcon />
                        </ButtonBase>

                        <InputBase
                            id="searchInput"
                            placeholder="搜点啥..."
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            inputProps={{ 'aria-label': 'search' }}
                            onChange={updateSearchValue}
                            defaultValue={defaultSearch}
                            onKeyDown={(e) => {
                                if (e.keyCode === 13) {
                                    doSearch()
                                }

                            }}
                        />
                        <ButtonBase className={classes.topbarButton} onClick={doSearch}>
                            <SearchIcon />
                        </ButtonBase>
                    </Paper>
                </Toolbar>
            </AppBar>
        </HideOnScroll>
    )
}