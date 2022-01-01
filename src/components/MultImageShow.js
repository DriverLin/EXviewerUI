import Grid from '@mui/material/Grid';
import React, { useState, useEffect, useRef } from 'react';
import Skeleton from '@mui/material/Skeleton';
import { height } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';


function SkeImg(props) {
    const [stause, setStause] = useState('loading')//loading error finished
    let img = new Image()
    img.onload = () => {
        setStause('finished')
        img = null
    }
    img.onerror = () => {
        setStause('error')
    }
    img.src = props.src

    const elemMap = {
        'loading':
            <div style={{
                height: "auto",
                width: props.maxWidth,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }} >
                <CircularProgress />
            </div>,
        'error':
            <div style={{
                height: "auto",
                width: props.maxWidth,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }} >
                <BrokenImageIcon />
            </div>,
        'finished':
            <img src={props.src} style={{ maxHeight: "100vh", maxWidth: props.maxWidth }} />
    }
    return elemMap[stause]
}




export default function MultImageShow(props) {
    const mapSrc = []
    let maxWidth = "100vw"
    if (props.srcs.length === 2) {
        maxWidth = "50vw"
        if (props.lr) {
            mapSrc.push(props.srcs[1])
            mapSrc.push(props.srcs[0])
        } else {
            mapSrc.push(props.srcs[0])
            mapSrc.push(props.srcs[1])
        }
    } else {
        mapSrc.push(props.srcs[0])
    }



    return (
        <Grid
            sx={{
                width: "100vw",
                height: "100vh",
            }}
            container
            direction="row"
            justifyContent="center"
            alignItems="center"
        >
            {
                mapSrc.map((src, index) => {
                    return (
                        <SkeImg
                            key={index}
                            src={src}
                            maxWidth={maxWidth}
                        />
                    )
                })
            }
        </Grid>


    )
}
