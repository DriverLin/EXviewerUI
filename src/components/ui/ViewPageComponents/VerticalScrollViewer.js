import { useState, useEffect, useRef, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { useEventListener } from 'ahooks';


function ImageLoader(props) {
    const [state, setState] = useState(props.cache.current[props.index] ? "finish" : "loading")
    const refImg = useRef()

    useEffect(() => {
        if (props.cache.current[props.index] === undefined && state === "finish") {
            props.onLoad(props.index, refImg.current.naturalHeight / refImg.current.naturalWidth)
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
            style={{
                width: "100vw",
                height: "auto",
                verticalAlign: "middle",
                display: state === "finish" ? "" : "none",
            }}
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


const calcTop = (index, imgCache) => {//????????????????????????offsetHeight
    let h = 0
    imgCache.current.forEach((aspectRatio, i) => {
        if (i < index) {
            h += aspectRatio ? aspectRatio * document.body.clientWidth : document.body.clientWidth * 1.41
        }
    });
    return h
}


const calcStart = (scrollTop, imgCache) => {//???????????? ???????????????????????????
    for (let i = 0; i < imgCache.current.length; i++) {
        const itemTop = calcTop(i, imgCache)
        if (itemTop >= scrollTop) {
            return i
        }

    }
    return imgCache.current.length
}

export default function VerticalScrollViewer(props) {//resize?????????????????????  ??????????????????
    const imgCache = useRef(props.urls.map(_ => undefined))//undefined????????????document.body.clientWidth*1.41
    const [imgTop, _setImgTop] = useState(props.urls.map(_ => undefined))
    const imgTopRef = useRef(props.urls.map(_ => undefined))
    const setImgTop = (v) => {
        imgTopRef.current = v
        _setImgTop(v)
    }

    const [pageIndex, setPageIndex] = useState(props.value)

    const start = Math.max(pageIndex - 3, 0)
    const end = Math.min(pageIndex + 5, props.urls.length)

    const lastStart = useRef(-1)
    useEventListener('scroll', (e) => {
        const calcRes = calcStart(document.scrollingElement.scrollTop, imgCache)
        if (lastStart.current === calcRes) return
        lastStart.current = calcRes
        setPageIndex(calcRes)
        if (props.value !== calcRes) {
            props.setValue(calcRes)
        }
    })

    useEffect(() => {
        if (lastStart.current === props.value) {
            return
        }
        lastStart.current = props.value
        const index = props.value - 1
        const targetImgTop = imgTop[index] || calcTop(index, imgCache)
        document.scrollingElement.scrollTop = targetImgTop + 1
        const calcRes = calcStart(document.scrollingElement.scrollTop, imgCache)
        setPageIndex(calcRes)
    }, [props.value])

    const setImageSize = (index, aspectRatio) => {//??????????????????????????? ????????????????????????????????? *??????start???????????????????????????
        imgCache.current[index] = aspectRatio
        const tops = props.urls.map((_, index) => calcTop(index, imgCache))
        setImgTop(tops)
        // if (index <= pageIndex) {
        //     const offset = document.body.clientWidth * aspectRatio - document.body.clientWidth * 1.41
        //     document.scrollingElement.scrollBy(0, offset)
        //     console.log(index, aspectRatio, "->", offset)
        // }else{   
        //     console.log(index, aspectRatio,'?????????',0)
        // }
    }

    const totalH = useMemo(() => {//?????????????????????????????????  ??????????????????????????????
        return imgTop[props.urls.length - 1] || calcTop(props.urls.length - 1, imgCache)
    }, [imgCache.current, imgTop])

    useEventListener("resize", (e) => {
        const tops = props.urls.map((_, index) => calcTop(index, imgCache))
        setImgTop(tops)
        const calcRes = calcStart(document.scrollingElement.scrollTop, imgCache)
        if (lastStart.current === calcRes) return
        lastStart.current = calcRes
        setPageIndex(calcRes)
    })


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