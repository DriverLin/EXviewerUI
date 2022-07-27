import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { AppBar, ButtonBase, Grid, InputBase, Paper, Slide, useMediaQuery } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useLocation } from "react-router-dom";
import { getGuess } from "../../utils/GetTranslate";
import { v4 as uuidGenerator } from 'uuid';
import AddIcon from '@mui/icons-material/Add';

function HideOnScroll(props) {
    const { children, __window, hidden } = props;
    return (
        <Slide appear={false} direction="down" in={!hidden}>
            {children}
        </Slide>
    );
}

HideOnScroll.propTypes = {
    children: PropTypes.element.isRequired,
    window: PropTypes.func,
};


export default function TopSearchBar(props) {
    const uuid = useRef(uuidGenerator())
    const small_matches = useMediaQuery('(min-width:560px)')
    const break_matches = useMediaQuery('(min-width:840px)')

    const rootWidth = useMemo(() => {
        if (small_matches) {
            if (break_matches) {
                return 680
            } else {
                return "calc(100vw - 160px)"
            }
        } else {
            return "calc(100vw - 120px)"
        }
    }, [small_matches, break_matches])

    const autoCompleteWidth = useMemo(() => {
        if (small_matches) {
            if (break_matches) {
                return 780
            } else {
                return "calc(100vw - 60px)"
            }
        } else {
            return "calc(100vw - 20px)"
        }
    }, [small_matches, break_matches])


    const useStyles = makeStyles((theme) => ({
        inputRoot: {
            width: rootWidth,
        },
        inputInput: {
            "&.MuiInputBase-input": {
                color: theme.palette.search.text
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

    const searchValueRef = useRef(props.initText);
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



    const [autoCompleteLoading, startAutoComplete] = useTransition(250)
    const handelAutoComplete = (inputText) => {
        startAutoComplete(() => {
            const guessTarget = getWordOfLast(inputText)
            const maxLength = 25
            if (guessTarget.length > 0) {
                const guessResult = getGuess(guessTarget, maxLength)
                setAutocomplete(true)
                setGuess(guessResult)
            } else {
                setAutocomplete(false)
                setGuess([])
            }
        })
    }

    const finishAutoComplete = (data) => {
        inputFocusState.current = true
        document.getElementById(uuid.current).focus()
        const replaced = searchValueRef.current.replace(getWordOfLast(searchValueRef.current), `${data.type}:"${data.origin}$"`)
        searchValueRef.current = replaced
        props.setSearchValue(replaced)
        setGuess([])
    }

    const updateSearchValue = (e) => {
        searchValueRef.current = e.target.value;
        props.setSearchValue(e.target.value);
        handelAutoComplete(e.target.value)
    }
    const inputFocusState = useRef(false)
    const AutoCompleteItem = ({ data }) =>
        <ButtonBase
            onClick={() => { finishAutoComplete(data) }}
            sx={{
                width: "100%",
                height: 55,
                textAlign: "left",
                borderTop: "1px solid",
                borderColor: "search.split",
                backgroundColor: "search.color",
                color: "search.text",
            }}>
            <div style={{
                width: "100%",
                marginLeft: 50,
                textAlign: "left",
                alignItems: "left"
            }} >
                <div style={{ fontSize: "1.2rem" }}   >{data.type + ":" + data.origin}</div>
                <div style={{ fontSize: "1rem" }} >{data.translated}</div>
            </div>
        </ButtonBase>



    return (
        <HideOnScroll {...props}>
            <AppBar style={{
                marginTop: 22,
                backgroundColor: "#00000000",
                boxShadow: "None"
            }}>
                <Paper
                    sx={{ margin: "0 auto", overflow: "hidden", backgroundColor: "search.color", color: "search.text" }}>
                    <div>
                        <ButtonBase
                            name='clickable'
                            sx={{
                                width: 50,
                                height: 50,
                                backgroundColor: "search.color",
                                color: "search.text",
                            }} onClick={props.leftButtonClick} >
                            <MenuIcon />
                        </ButtonBase>
                        <InputBase
                            id={uuid.current}
                            placeholder="搜点啥..."
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            inputProps={{ 'aria-label': 'text' }}
                            autoComplete='off'
                            value={props.searchValue}
                            onChange={updateSearchValue}
                            onFocus={() => {
                                setAutocomplete(true)
                                inputFocusState.current = true
                                props.onFocus()
                            }}
                            onBlur={() => {
                                inputFocusState.current = false //inputFocusState.current设置为false
                                setTimeout(() => {//等待一段时间检查 仍然是false 才blur 
                                    if (inputFocusState.current === false) {
                                        setAutocomplete(false)
                                        props.onBlur()
                                    }
                                }, 250);//为了达成点击自动填充项目不会丢失focus的目的
                            }}

                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    props.doSearch()
                                }

                            }}
                        />
                        <ButtonBase
                            name='clickable'
                            sx={{
                                width: 50,
                                height: 50,
                                backgroundColor: "search.color",
                                color: "search.text",
                            }}
                        // onClick={props.doSearch}
                        >
                            <AddIcon sx={{
                                transition: ".3s",
                                transform: "rotateZ(45}deg)"
                            }} />
                        </ButtonBase>
                    </div>
                    {
                        autocomplete && guess.length !== 0 && <div style={{
                            width: autoCompleteWidth,
                            overflow: "hidden",
                        }}>
                            <div
                                style={{
                                    width: "calc(100% + 20px)",
                                    maxHeight: "calc(min(60vh,550px))",
                                    overflowY: "scroll",
                                    overflowX: "hidden",
                                }}
                            >
                                <Grid
                                    container
                                    direction="column"
                                    justifyContent="flex-start"
                                    alignItems="center"
                                    sx={{ width: "100%", }}
                                >
                                    {
                                        guess.map((item, index) => <AutoCompleteItem key={index} data={item} />)
                                    }
                                </Grid>
                            </div>
                        </div>
                    }
                </Paper>
            </AppBar>
        </HideOnScroll>
    )
}
