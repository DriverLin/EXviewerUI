import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import React, { useEffect, useState } from 'react';


function SkeImg(props) {
    const [stause, setStause] = useState('loading')//loading error finished
    const loadImg = (e) => {
        if (e) {
            e.stopPropagation();
        }
        setStause('loading')
        let img = new Image()
        img.onload = () => {
            setStause('finished')
            img = null
        }
        img.onerror = () => {
            setStause('error')
        }
        img.src = props.src
    }

    useEffect(() => {
        loadImg()
    }, [props.src])

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
                height: "100%",
                width: props.maxWidth,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
            >
                <div style={{
                    width: "40%",
                    height: "40%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                    onClick={loadImg}
                >
                    <BrokenImageIcon />
                </div>
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
