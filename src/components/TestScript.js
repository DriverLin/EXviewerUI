import React, { useState, useEffect, useRef } from 'react';

import { Button, Paper, Grid, Snackbar, Rating, Alert, useMediaQuery, Card } from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import GetTranslate from "./GetTranslate.js"

import { styled, makeStyles } from '@mui/styles';


const ButtonTag_data = styled(Button)(({ theme }) => ({
    color: "#ffffff",
    backgroundColor: "#4A4A4A",
    textTransform: "none",
    height: "32px",
    fontSize: "10pt",
    margin: "10px",

    "&:hover": {
        background: "#646464",
    },
}));

export default function TestScript(props) {
    return (
        <React.Fragment >
            <ButtonTag_data variant="contained" >hello</ButtonTag_data>            
        </React.Fragment>
    )
}