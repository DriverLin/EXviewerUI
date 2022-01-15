import React, { useState, useEffect,useRef } from 'react';
import { Slider, Slide } from '@mui/material';

export default function RevSlider(props) {
    const translateFatherValue = () => {
        return props.reverse ? props.max - props.value + 1 : props.value 
    };//将父组件的值 转换为子组件的内部值
    const translateSelfValue = () => {
        return props.reverse ? props.max - privateValueRef.current + 1 : privateValueRef.current 
    };//反向转换

    const privateValueRef = useRef(translateFatherValue());
    const [priveteValue, sePrivateValue] = useState(translateFatherValue());

    const setSelfValue = (value) => {
        sePrivateValue(value);
        privateValueRef.current = value;
    }

    const handelSliderValue = (value) => { 
        return (props.reverse ? props.max - value + 1 : value )+"P";
    }

    const handleSliderChangeCommitted = (event, value) => { 
        setSelfValue(value);
        props.setValue(translateSelfValue())
    }

    const handleSliderChange = (event, value) => { 
        setSelfValue(value);
    }

    useEffect(() => {
        if (translateFatherValue() !== privateValueRef.current) {
            setSelfValue(translateFatherValue());
        }
    }, [props.value, props.reverse]);

    return (
        <Slide
            direction="up"
            in={props.open}
            mountOnEnter
            unmountOnExit
        >
            <div style={{
                zIndex: 1,
                left:"10%",
                width: "80%",
                position: "fixed",
                bottom: 80
            }} >
                <Slider
                    sx={{
                        color: 'primary.main',
                        height: 4,
                        '&.MuiSlider-trackInverted': {
                            color: "primary.main",
                            '& .MuiSlider-track': {
                                border: 'none',
                                color: "primary.main",
                            },
                        },
                        '& .MuiSlider-track': {
                            border: 'none',
                            color: "primary.main",
                        },
                        '& .MuiSlider-thumb': {
                            height: 16,
                            width: 16,
                            backgroundColor: '#fff',
                            border: '2px solid currentColor',
                            transition: '.2s',
                            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                                boxShadow: 'inherit',
                                
                            },
                            '&:before': {
                                display: 'none',
                            },
                        },
                        '& .MuiSlider-valueLabel': {
                            lineHeight: 1.2,
                            fontSize: 12,
                            background: 'unset',
                            padding: 0,
                            width: 32,
                            height: 32,
                            borderRadius: '50% 50% 50% 0',
                            backgroundColor: 'primary.main',
                            transformOrigin: 'bottom left',
                            transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                            '&:before': { display: 'none' },
                            '&.MuiSlider-valueLabelOpen': {
                                transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
                            },
                            '& > *': {
                                transform: 'rotate(45deg)',
                            },
                        },
                    }}
                    value={priveteValue}
                    step={1}
                    min={1}
                    max={props.max}
                    onChange={handleSliderChange}
                    onChangeCommitted={handleSliderChangeCommitted}
                    scale={handelSliderValue}
                    aria-labelledby="input-slider"
                    valueLabelDisplay="auto"
                    track={props.reverse ? "inverted" : "normal"}
                />
            </div>
        </Slide>
    )
}