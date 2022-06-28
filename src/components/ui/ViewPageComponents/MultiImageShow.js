import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import React, { useEffect, useRef, useState } from 'react';

function ImageLoader(props) {
    const [state, setState] = useState('loading')
    const refImg = useRef()
    const onLoad = () => {
        setState("finished")
    }
    const onError = () => {
        setState("error")
    }
    const reLoad = () => {
        if(refImg.current){
            setState("loading")
            refImg.current.src = props.src
        }
    }

    return <div>
        {
            state === 'loading' && <div style={{
                height: "auto",
                width: props.maxWidth,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }} >
                <CircularProgress />
            </div>
        }
        {
            state === 'error' && <div style={{
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
                    onClick={reLoad}
                >
                    <BrokenImageIcon />
                </div>
            </div>
        }
        {
            <img
                ref={refImg}
                onLoad={onLoad}
                onError={onError}
                src={props.src}
                style={{ maxHeight: state === "finished" ? "100vh" : 0, maxWidth: props.maxWidth }}
            />
        }
    </div>
}

export default function MultiImageShow(props) {
    const mapSrc = []
    let maxWidth = "100vw"
    if (props.urls.length === 2) {
        maxWidth = "50vw"
        if (props.lr) {
            mapSrc.push(props.urls[1])
            mapSrc.push(props.urls[0])
        } else {
            mapSrc.push(props.urls[0])
            mapSrc.push(props.urls[1])
        }
    } else {
        mapSrc.push(props.urls[0])
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
                        <ImageLoader
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
