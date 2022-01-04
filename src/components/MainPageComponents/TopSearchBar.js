import React, { useRef, useState } from 'react';
import { Grid, InputBase, ButtonBase, useScrollTrigger, Paper, AppBar, Toolbar, Slide, useMediaQuery, autocompleteClasses } from '@mui/material';
import { makeStyles } from '@mui/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PropTypes from 'prop-types';
import { useLocation } from "react-router-dom";
import { getGuess } from "../GetTranslate"

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
    const locationProps = useLocation()

    const defaultSearch = decodeURIComponent(locationProps.search).replace('?f_search=', '')
    const useStyles = makeStyles((theme) => ({
        inputRoot: {
            width: matches ? 630 : document.body.clientWidth - 160,
        },
        inputInput: {
            "&.MuiInputBase-input": {
                color: theme.palette.text.main
            }
        },
        drawer: {
            width: "100%",
            flexShrink: 0,
        },
        drawerPaper: {
            width: "100%",
        },

    }));
    const classes = useStyles();

    const searchValueRef = useRef(defaultSearch);
    const [searchValue, setSearchValue] = useState(defaultSearch);
    const [guess, setGuess] = useState([])
    const [autocomplete, setAutocomplete] = useState(false)


    const getWordOfLast = (inputText) => {
        let tags = inputText.match(/[A-Za-z0-9]+:"[^\$]+\$"/g)
        if (tags === null) tags = [];
        let tmpInputCopy = inputText
        tags.forEach(item => {
            tmpInputCopy = tmpInputCopy.replace(item, "")
        })
        let words = tmpInputCopy.match(/[\u0800-\u4e00\u4E00-\u9FA5A-Za-z0-9_]+/g)
        if (words === null) words = [];
 
        if (words.length === 0) {
            return ""//words长度为0 返回空
        }
        if (tags.length === 0) {
            return words[words.length - 1] //words 长度不为0 tags长度为0 返回words最后一个单词
        }
        const replaceRightSpace = inputText.replace(/(\s*$)/g, "")
        const lastTag = tags[tags.length - 1]
        // const lastTag
        if (replaceRightSpace.indexOf(lastTag) + lastTag.length === replaceRightSpace.length) {
            //words长度不为0 tags长度不为0 最后一个部分是tag
            return ""
        } else {
            //words长度不为0 tags长度不为0 最后一个部分是word
            return words[words.length - 1]
        }
    }

    const handelAutcomplete = (inputText) => {
        const guessTarget = getWordOfLast(inputText)
        if (guessTarget.length > 0) {
            const guessResult = getGuess(guessTarget)
            setAutocomplete(true)
            setGuess(guessResult)
        } else {
            setAutocomplete(false)
            setGuess([])
        }
    }

    const finishAutoComplete = (data) => {
        document.querySelector("#searchInputBase_d68sh5g4sdeth46sth").focus()
        const replaced = searchValueRef.current.replace(getWordOfLast(searchValueRef.current), `${data.type}:"${data.origin}$"`)
        searchValueRef.current = replaced
        setSearchValue(replaced)
        setGuess([])
    }

    const updateSearchValue = (e) => {
        searchValueRef.current = e.target.value;
        setSearchValue(e.target.value);
        handelAutcomplete(e.target.value)
    }
    const doSearch = () => {
        // console.log("searching for: " + searchValueRef.current);
        props.doSearch(searchValueRef.current)
    }

    const inputFocusStause = useRef(false)

    const AutoCompleteItem = (props) => {
        return <ButtonBase
            onClick={
                () => {
                    finishAutoComplete(props.data)
                }
            }
            sx={   {
                width: matches ? 730 : document.body.clientWidth - 60,
                height: 55,
                textAlign: "left",
                borderTop: "1px solid #e0e0e0",
                backgroundColor: "background.secondary",
                color:"text.main",
            }
            }>
            <div style={{
                width: "100%",
                marginLeft: 50,
                textAlign: "left",
                alignItems: "left"
            }} >
                <div style={{ fontSize: "1.2rem" }}   >{props.data.type + ":" + props.data.origin}</div>
                <div style={{ fontSize: "1rem" }} >{props.data.translated}</div>
            </div>
        </ButtonBase>
    }

    const AutoInputElems = <div style={{
        width: "100%",
        maxHeight: "calc(min(60vh,550px))",
        overflow: "scroll",
    }}>
        <Grid
            container
            direction="column"
            justifyContent="flex-start"
            alignItems="center"
        >
            {
                guess.map((item, index) => {
                    return <AutoCompleteItem key={index} data={item}
                    />
                })
            }
        </Grid>
    </div>

    return (
        <HideOnScroll {...props}>
            <AppBar style={{
                marginTop: 22,
                backgroundColor: "#00000000",
                boxShadow: "None"
            }}>
                <Paper sx={{ margin: "0 auto", overflow: "hidden", backgroundColor: "background.secondary", color: "text.main" }}>
                    <div>
                        <ButtonBase sx={{
                            width: 50,
                            height: 50,
                            backgroundColor: "background.secondary",
                            color: "text.main",
                        }} onClick={props.leftButtonClick} >
                            <MenuIcon />
                        </ButtonBase>
                        <InputBase
                            id="searchInputBase_d68sh5g4sdeth46sth"
                            placeholder="搜点啥..."
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            inputProps={{ 'aria-label': 'text' }}
                            autoComplete='off'
                            value={searchValue}


                            onChange={updateSearchValue}
                            defaultValue={defaultSearch}
                            onFocus={() => {
                                setAutocomplete(true)
                                inputFocusStause.current = true
                                console.log("focus")
                            }}
                            onBlur={() => {
                                inputFocusStause.current = false
                                setTimeout(() => {
                                    if (inputFocusStause.current === false) {
                                        setAutocomplete(false)
                                    }
                                }, 250);
                            }}

                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    doSearch()
                                }

                            }}
                        />
                        <ButtonBase sx={{
                            width: 50,
                            height: 50,
                            backgroundColor: "background.secondary",
                            color: "text.main",
                        }} onClick={doSearch}>
                            <SearchIcon />
                        </ButtonBase>
                    </div>
                    {
                        autocomplete && guess.length !== 0 ? AutoInputElems : null
                    }

                </Paper>
            </AppBar>
        </HideOnScroll>
    )
}
