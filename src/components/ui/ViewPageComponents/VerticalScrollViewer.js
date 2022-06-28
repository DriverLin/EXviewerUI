import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import CircularProgress from '@mui/material/CircularProgress';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { style } from '@mui/system';
import { useEventListener, useVirtualList } from 'ahooks';






function ImageLoader(props) {
    const [state, setState] = useState(props.cache.current[props.index] ? "finish" : "loading")
    const refImg = useRef()

    useEffect(() => {
        if (props.cache.current[props.index] === undefined && state === "finish") {
            props.onLoad(props.index, { width: refImg.current.width, height: refImg.current.height })
        }
    }, [state])


    const onLoad = () => {
        setState("finish")
    }

    const onError = () => {
        setState("error")
    }
    const reload = () => {
        setState("loading")
        refImg.current.src = props.src
    }
    return <div style={{ ...(props.style || {}) }}>
        <img
            ref={refImg}
            src={props.src}
            onLoad={onLoad}
            onError={onError}
            style={{ width: "100vw", height: state === "finish" ? "auto" : "0px", verticalAlign: "middle" }}
        />
        {
            state !== "finish" && <div style={{
                height: "141vw",
                width: "100vw",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}>
                {
                    state === "error" && <div style={{
                        width: "40%",
                        height: "40%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                        onClick={reload}
                    >
                        <BrokenImageIcon />
                    </div>
                }
                {state === "loading" && <CircularProgress />}
            </div>
        }
    </div>
}


const calcTop = (index, imgCache) => {//计算图片显示位置offsetHeight
    let h = 0
    imgCache.current.forEach((info, i) => {
        if (i < index) {
            h += info?.height || document.body.clientWidth * 1.41
        }
    });
    return h
}


const calcStart = (pageH, scrollTop, imgCache) => {//根据滚动 计算当前显示的图片
    for (let i = 0; i < imgCache.current.length; i++) {
        const itemTop = calcTop(i, imgCache)
        if (itemTop >= scrollTop) {
            return i
        }
    }
}

export default function VerticalScrollViewer(props) {//resize建议直接重渲染  别费那个劲了
    const imgCache = useRef(props.urls.map(_ => undefined))//undefined的高度为document.body.clientWidth*1.41
    const [imgTop, _setImgTop] = useState(props.urls.map(_ => undefined))
    const imgTopRef = useRef(props.urls.map(_ => undefined))
    const setImgTop = (v) => {
        imgTopRef.current = v
        _setImgTop(v)
    }

    const [data, setData] = useState({
        current: props.value,
        total: props.urls.length,
    })

    const start = Math.max(data.current - 3, 0)
    const end = Math.min(data.current + 5, data.total)


    const lastStart = useRef(-1)
    useEventListener('scroll', (e) => {
        const calcRes = calcStart(document.scrollingElement.clientHeight, document.scrollingElement.scrollTop, imgCache)
        if (lastStart.current === calcRes) return
        lastStart.current = calcRes
        setData(old => { return { ...old, current: calcRes } })
        if(props.value !== calcRes){
            props.setValue(calcRes)
        }
    })

    useEffect(() => {
        if (lastStart.current === props.value){
            return
        }
        lastStart.current = props.value
        const index = props.value -1
        const targetImgTop = imgTop[index ] || calcTop(index, imgCache)
        document.scrollingElement.scrollTop = targetImgTop +1
        const calcRes = calcStart(document.scrollingElement.clientHeight, document.scrollingElement.scrollTop, imgCache)
        setData(old => { return { ...old, current: calcRes } })
    }, [props.value])

    const setImageSize = (index, info) => {//每当有图片加载完成 重新计算所有图片的高度 并保证start图片的相对位置不变
        imgCache.current[index] = info
        const tops = props.urls.map((_, index) => calcTop(index, imgCache))
        setImgTop(tops)
    }

    const totalH = useMemo(() => {
        return imgTop[props.urls.length-1] || calcTop(props.urls.length-1, imgCache)
    }, [imgCache,imgTop])

    return <div style={{ width: "100vw", height: totalH }} >
        {
            props.urls.slice(start, end).map((url, offsetIndex) => {
                const index = start + offsetIndex
                return <div
                    key={index}
                    style={{
                        position: "absolute",
                        top: imgTop[index] || calcTop(index, imgCache)
                    }}
                >
                    <ImageLoader
                        src={url}
                        index={index}
                        cache={imgCache}
                        onLoad={setImageSize}
                    />
                </div>
            })
        }
    </div>
}