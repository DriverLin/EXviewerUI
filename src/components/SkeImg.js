import Skeleton from '@mui/material/Skeleton';
import React, { useState, useEffect, useRef } from 'react';




export default function SkeImg(props) {
    
    const [stause, setStause] = useState('loading')//loading error finished

    const img = new Image()
    img.onload = () => {
        setTimeout(() => {
            setStause('finished')
        }, 1000)
    }

    img.onerror = () => {
        setStause('error')
    }

    img.src = props.src

    return (
        <div style={props.style}>
            {
                stause === 'loading' ?
                    <Skeleton variant="rectangular" sx={{ ...props.style, height: 0, paddingBottom: "141.25%"}} />
                    :
                    stause === 'error' ?
                        <div style={props.style} />
                        :
                        <img src={props.src}  style={props.style}  />
            }
        </div>
    )
}

