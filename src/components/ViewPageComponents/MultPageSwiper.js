import React, { useState, useEffect, } from 'react';
import TwoWaySwiper from './TwoWaySwiper';
import MultImageShow from './MultImageShow';
export default function MultPageSwiper(props) {

    const [value, _setValue] = useState(Number(props.value));
    const [mapedUrls, setMapedUrls] = useState([]);

    const out2in = () => {
        if (props.double) {
            if (props.headsingle) {
                return Math.floor(props.value / 2) + 1
                //奇数对应
            } else {
                return Math.floor((props.value + 1) / 2)
                //偶数对应
            }
        } else {
            return props.value
        }
    }
    const in2out = (privateValue) => {
        // console.log('in2out', props.double, props.headsingle, privateValue);
        if (props.double) {
            if (props.headsingle) {
                return (privateValue - 1) * 2 +1
                //奇数对应
            } else {
                //偶数对应
                return privateValue * 2 
            }
        } else {
            return privateValue
        }
    }

    const setValue = (eventValue) => {
        _setValue(eventValue);
        props.setValue(in2out(eventValue));
    }

    useEffect(() => {
        // console.log('MultPageSwiper useEffect props.value', props.value)
        // console.log("ou2in", out2in())
        if (out2in() !== value) {
            _setValue(out2in());
        }
    }, [props.value])



    useEffect(() => {
        const newUrls = []
        const tmpUrl = [...props.urls]
        if (props.double) {
            if (!props.headsingle === false) {
                newUrls.push([tmpUrl[0]])
                tmpUrl.shift()
            }//修改跨页阅读
            for (let i = 0; i < tmpUrl.length; i++) {
                const groupIndex = Math.floor(i / 2) + (!props.headsingle ? 0 : 1)
                if (newUrls[groupIndex] === undefined) {
                    newUrls[groupIndex] = [tmpUrl[i]]
                } else {
                    newUrls[groupIndex].push(tmpUrl[i])
                }
            }
        } else {
            tmpUrl.forEach((url) => {
                newUrls.push([url])
            })
        }
        setMapedUrls(newUrls)
    }, [props.urls, props.double, props.headsingle])

    return (
        <TwoWaySwiper
            value={value}
            setValue={setValue}
            reverse={props.reverse}
        >
            {
                mapedUrls.map((item, index) => {
                    return <MultImageShow lr={ props.reverse } key={index} srcs={item} />
                })
            }
        </TwoWaySwiper>

        // <div style={{
        //     color: "white",
        //     width: "90vw",
        //     height: "90vh",
        //     border: "5px solid white",
        //     // fontSize: "50px",
        //     textAlign: "center",
        // }} >
        //    {JSON.stringify(mapedUrls)}
        // </div>
    )
}

