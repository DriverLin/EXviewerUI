import LinearProgress from '@mui/material/LinearProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Collection } from 'react-virtualized';
import 'react-virtualized/styles.css';
import GallaryCard from "./GallaryCard";

const openCurrentTab = (url) => {
    window.location.href = "/#" + url
}


const openNewTab = (url) => {
    // window.open("/#" + url, "_blank")
    openCurrentTab(url)
}


export default function OnlineManinPage(props) {
    const break_matches = useMediaQuery('(min-width:840px)');//是否双列展示
    const small_matches = useMediaQuery('(min-width:560px)');//是否小尺寸
    const [documentWidth, setDocumentWidth] = useState(document.body.clientWidth)
    const [documentHeight, setDocumentHeight] = useState(document.body.clientHeight)
    
    const requestNextPage = async () => {
        await props.requestData()
    }

    const viewCallBack = (gid,token) => {
        // openNewTab(`/g/${gid}/${token}/`)
        props.openNew(`/g/${gid}/${token}/`,"")
    }
    const infoCallBack = (gid,token) => {
        // openNewTab(`/viewing/${gid}/${token}/`)
        props.openNew(`/viewing/${gid}/${token}/`,"")
        
    }

    const cellRenderer = ({ index, key, style }) => {
        const newStyle = {
            ...style,
            width: cardWidth,
            height: cardHeight + (small_matches ? 30 : 10),//这里实际是边框加高度 这样再加载到最底部的时候就不会紧贴下面了
            left: calLeft(index),
            // top: calTop(index),//不行 ，如果更新 则虚拟滚动的设置越要更新  所以干脆直接重新加载
        }
        const cardData = props.gallarys[index]
        const gid = Number(cardData.gid)
        return <div key={key} style={newStyle}>
            <GallaryCard
                {...cardData}
                inprocess={props.states[gid] === undefined ? false :  props.states[gid][0]}
                favo={props.states[gid] === undefined ? -1 :  props.states[gid][1]}
                download={props.states[gid] === undefined ? -2 :  props.states[gid][2]}
                small_matches={small_matches}
                infoCallBack={infoCallBack}
                viewCallBack={viewCallBack}
                longClickCallback={props.longClickCallback}
            />
        </div>
    }


    const cardWidth = useMemo(() => {
        if (break_matches) {
            return (document.body.clientWidth - 90) / 2
        } else {
            if (small_matches) {
                return document.body.clientWidth - 60
            } else {
                return document.body.clientWidth - 20
            }
        }
    }, [documentWidth, break_matches, small_matches])
    const cardHeight = useMemo(() => small_matches ? 200 : 160, [small_matches])
    const calLeft = useCallback((index) => {
        const border = small_matches ? 30 : 10
        if (break_matches) {
            if (index % 2 === 0) {
                return border
            } else {
                return border * 2 + (document.body.clientWidth - 90) / 2
            }
        } else {
            return border
        }
    }, [break_matches, small_matches])

    const calTop = useCallback((index) => { //60 搜索框空出来
        const border = small_matches ? 30 : 10
        const cellHeight = small_matches ? 230 : 170
        const topOfffset = small_matches ? 60 : 80
        if (break_matches) {
            return Math.floor(index / 2) * cellHeight + border + topOfffset
        } else {
            return index * cellHeight + border + topOfffset
        }
    }, [break_matches, small_matches])


    function cellSizeAndPositionGetter({ index }) {
        return {
            height: cardHeight,
            width: cardWidth,
            x: calLeft(index),
            y: calTop(index),
        };
    }

    // useEffect(() => {
    //     requestNextPage()
    // }, [])
    const lastE = useRef(0);
    const handelVscroll = (e) => {
        const dis2trigger = 3
        const end = e.scrollHeight - e.scrollTop - e.clientHeight
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            console.log("触发加载")
            requestNextPage()
        }
        lastE.current = end
        // console.log("sendEvent",`vScrollEvent-${props.scuid}`)
        // const vScrollEvent = new Event(`vScrollEvent-${props.uid}`);
        // vScrollEvent.e = e;
        // window.dispatchEvent(vScrollEvent);
        props.setScrollTop(e.scrollTop)
    }

    const resizeWindow = (e) => {
        setDocumentWidth(document.body.clientWidth)
        setDocumentHeight(document.body.clientHeight)
    }

    useEffect(() => {
        window.addEventListener("resize", resizeWindow);
        return () => {
            window.removeEventListener("resize", resizeWindow);
        }
    }, [])

    const scallkey = useMemo(() => (small_matches ? 1 : 0) * 10 + (break_matches ? 0 : 1), [small_matches, break_matches])

    // useEffect( () => {
        // console.log(scallkey)
    // },[scallkey])
        

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <Collection
                key={scallkey}
                cellCount={props.gallarys.length}
                cellRenderer={cellRenderer}
                cellSizeAndPositionGetter={cellSizeAndPositionGetter}
                onScroll={handelVscroll}
                height={(documentHeight || document.body.clientHeight)}
                width={(documentWidth || document.body.clientWidth) + 100}
                verticalOverscanSize={25}
                id={"this_is_vscroll"}
                // scrollTop={props.initScrollOffset || 0}
            />
            {
                props.loading ? <div
                    style={{
                        position: "fixed",
                        bottom: "0px",
                        width: "100%",
                    }}
                ><LinearProgress color='primary' /></div> : null
            }
        </div>
    )
}