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
        if (props.double) {
            if (props.headsingle) {
                return (privateValue - 1) * 2 + 1
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
        // console.log("eventValue",eventValue)
        _setValue(eventValue);
        props.setValue(in2out(eventValue));
    }

    useEffect(() => {
        if (out2in() !== value) {
            _setValue(out2in());
        }
    }, [props.value])


    useEffect(() => {
        const newUrls = []
        const tmpUrl = [...props.urls]
        if (props.double) {
            if (!props.headsingle === false) {// [1,2] [3,4] [5,6] [7,8] ...
                newUrls.push([tmpUrl[0]])
                tmpUrl.shift()
            }//修改跨页阅读
            for (let i = 0; i < tmpUrl.length; i++) {// [1] [2,3] [4,5] [6,7] ...
                const groupIndex = Math.floor(i / 2) + (!props.headsingle ? 0 : 1)
                if (newUrls[groupIndex] === undefined) {
                    newUrls[groupIndex] = [tmpUrl[i]]
                } else {
                    newUrls[groupIndex].push(tmpUrl[i])
                }
            }
        } else {
            tmpUrl.forEach((url) => {
                newUrls.push([url])// [1] [2] [3] [4] ...
            })
        }
        setMapedUrls(newUrls)
    }, [props.urls, props.double, props.headsingle])


    // useEffect(() => {
    //     console.log("swiper mount")
    //     return () => {
    //         console.log("swiper unmount")
    //     }
    // }, [])

    return (
        <TwoWaySwiper
            value={value}
            setValue={setValue}
            reverse={props.reverse}
        >
            {
                mapedUrls.map((item, index) => {
                    return <MultImageShow lr={props.reverse} key={index} srcs={item} />
                })
            }
        </TwoWaySwiper>

    )
}

