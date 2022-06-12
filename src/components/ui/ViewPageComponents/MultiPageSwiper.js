import React, { useEffect, useMemo, useState } from 'react';
import MultiImageShow from './MultiImageShow';
import TwoWaySwiper from './TwoWaySwiper';

/**
 * 单页包含多张图片的swiper
 * @param {Object} props 
 * @param {Number} props.value
 * @param {function} props.setValue
 * @param {Boolean} props.reverse 
 * @param {Boolean} props.double
 * @param {Boolean} props.pagination
 * @param {string[]} props.urls
 */



export default function MultiPageSwiper(props) {
    const [value, _setValue] = useState(Number(props.value));
    const [splittedUrls, setSplittedUrls] = useState([]);

    const out2in = useMemo(() => {
        if (props.double) {
            if (props.pagination) {
                return Math.floor(props.value / 2) + 1//奇数对应
            } else {
                return Math.floor((props.value + 1) / 2)//偶数对应
            }
        } else {
            return props.value
        }
    }, [props.double, props.pagination, props.value])

    const in2out = (privateValue) => {
        if (props.double) {
            if (props.pagination) {
                return (privateValue - 1) * 2// + 1 //奇数对应
            } else {
                return privateValue * 2 //偶数对应
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
        if (out2in !== value) {
            _setValue(out2in);
        }
    }, [props.value])

    useEffect(() => {
        const newUrls = []
        const tmpUrls = [...props.urls]
        if (props.double) {
            if (!props.pagination === false) {// [1,2] [3,4] [5,6] [7,8] ...
                newUrls.push([tmpUrls[0]])
                tmpUrls.shift()
            }//修改跨页阅读
            for (let i = 0; i < tmpUrls.length; i++) {// [1] [2,3] [4,5] [6,7] ...
                const groupIndex = Math.floor(i / 2) + (!props.pagination ? 0 : 1)
                if (newUrls[groupIndex] === undefined) {
                    newUrls[groupIndex] = [tmpUrls[i]]
                } else {
                    newUrls[groupIndex].push(tmpUrls[i])
                }
            }
        } else {
            tmpUrls.forEach((url) => {
                newUrls.push([url])// [1] [2] [3] [4] ...
            })
        }
        setSplittedUrls(newUrls)
    }, [props.urls, props.double, props.pagination])

    return (
        <TwoWaySwiper
            value={value}
            setValue={setValue}
            reverse={props.reverse}
        >
            {
                splittedUrls.map((item, index) => {
                    return <MultiImageShow lr={props.reverse} key={index} urls={item} />
                })
            }
        </TwoWaySwiper>

    )
}

