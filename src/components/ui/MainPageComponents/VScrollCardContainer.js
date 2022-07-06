import LinearProgress from '@mui/material/LinearProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Collection } from 'react-virtualized';
import 'react-virtualized/styles.css';
import syncedDB, { DOWNLOAD_STATE, FAVORITE_STATE } from '../../utils/mobxSyncedState';
import GalleryCard from "./GalleryCard";
import { observer } from "mobx-react";
import { useEventListener } from 'ahooks';
import { v4 as uuidGenerator } from 'uuid';

export default function VScrollCardContainer(props) {
    const break_matches = useMediaQuery('(min-width:840px)');//是否双列展示
    const small_matches = useMediaQuery('(min-width:560px)');//是否切换小尺寸card
    const [documentWidth, setDocumentWidth] = useState(document.body.clientWidth)
    const [documentHeight, setDocumentHeight] = useState(document.body.clientHeight)

    const RenderObserver = observer(({ index, style }) => {
        const newStyle = {
            ...style,
            width: cardWidth,
            height: cardHeight + (small_matches ? 30 : 10),//这里实际是边框加高度 这样再加载到最底部的时候就不会紧贴下面了
            left: calLeft(index),
            // top: calTop(index),//不行 ，如果更新 则虚拟滚动的设置越要更新  所以干脆直接重新加载
        }
        const gid = props.cardGidList[index]
        const cardInfo = props.cardInfoMap[gid]
        return cardInfo ? <div style={newStyle}>
            <GalleryCard
                cardInfo={cardInfo}
                download={syncedDB.download[gid] || { state: DOWNLOAD_STATE.NOT_DOWNLOADED, success: 0 }}
                favorite={syncedDB.favorite[gid] || { state: FAVORITE_STATE.NOT_FAVORITED }}
                small_matches={small_matches}
                onImageClick={props.onImageClick}
                onLongClick={props.onLongClick}
                onCardClick={props.onCardClick}
            />
        </div> : null
    });
    function cellRenderer(args) {
        return <div key={args.key}>
            <RenderObserver
                index={args.index}
                isScrolling={args.isScrolling}
                style={args.style}
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
        const topOffset = small_matches ? 60 : 80
        if (break_matches) {
            return Math.floor(index / 2) * cellHeight + border + topOffset
        } else {
            return index * cellHeight + border + topOffset
        }
    }, [break_matches, small_matches])

    const cellSizeAndPositionGetter = ({ index }) => {
        return {
            height: cardHeight,
            width: cardWidth,
            x: calLeft(index),
            y: calTop(index),
        }
    }

    const overCardNum = useRef(0)
    const lastE = useRef(0);

    const handelVScroll = (e) => {
        const dis2trigger = 1
        const end = e.scrollHeight - e.scrollTop - e.clientHeight
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            console.log("触发加载")
            props.onReachEnd()
        }
        lastE.current = end
        if (e.scrollTop !== 0) {
            const cellHeight = small_matches ? 230 : 170;
            const div2 = break_matches ? 2 : 1;
            const cardNum = div2 * Math.floor(e.scrollTop / cellHeight)
            overCardNum.current = cardNum
        }
        props.setScrollTop(e.scrollTop)
    }

    const onWindowResize = (e) => {
        setDocumentWidth(document.body.clientWidth)
        setDocumentHeight(document.body.clientHeight)
    }
    useEventListener('resize', onWindowResize)

    const resizeKey = useMemo(() => JSON.stringify([small_matches, break_matches]), [small_matches, break_matches])

    const uuid = useRef(uuidGenerator())
    useEffect(() => {
        const cellHeight = small_matches ? 230 : 170;
        const offsetTop = cellHeight * overCardNum.current / (break_matches ? 2 : 1)
        document.getElementById(uuid.current).scrollTop = offsetTop
        // console.log("scrollTop", offsetTop)
    }, [resizeKey])

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <Collection
                key={resizeKey}
                cellCount={props.cardGidList.length}
                cellRenderer={cellRenderer}
                cellSizeAndPositionGetter={cellSizeAndPositionGetter}
                onScroll={handelVScroll}
                height={documentHeight}
                width={documentWidth + 100}
                verticalOverscanSize={25}
                id={uuid.current}
            />
            {
                props.loading ?
                    <div
                        style={{
                            position: "fixed",
                            bottom: "0px",
                            width: "100%",
                        }}
                    >
                        <LinearProgress color='primary' />
                    </div>
                    :
                    null
            }
        </div>
    )
}


