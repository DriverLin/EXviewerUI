import { useState, useEffect, useCallback } from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import CircularProgress from '@mui/material/CircularProgress';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { style } from '@mui/system';






function ImageRender(props) {
    const [state, setState] = useState("loading")
    const loadImage = () => {
        const img = new Image()
        img.onload = () => {
            // setTimeout(() => {
            try {
                setState("finish")
                props.onLoad()
            } catch (e) {
                console.log(e)
            }
            // }, 2500)

        }
        img.onerror = () => {
            setState("error")
        }
        img.src = props.src
    }

    useEffect(() => {
        loadImage()
    }, [])
    return <div style={{
        ...(props.style || {}),
        border: "1px solid #D90051",
    }}>
        {
            state === "loading" ? <div style={{//正方形
                height: "100vw",
                width: "100vw",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }} >
                <CircularProgress />
            </div> : null
        }
        {
            state === "finish" ? <img v src={props.src} style={{ width: "100%", height: "auto", verticalAlign: "middle" }} /> : null
        }
        {
            state === "error" ? <div style={{
                height: "100vw",
                width: "100vw",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <div style={{
                    width: "40%",
                    height: "40%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                    onClick={() => { }}
                >
                    <BrokenImageIcon />
                </div>
            </div> : null
        }
    </div>
}

export default function VerticalScrollViewer(props) {
    const [pageSize, setPageSize] = useState([1, 1])

    const cache = new CellMeasurerCache({
        // defaultHeight: document.body.clientWidth,
        defaultHeight: 1920,
        fixedWidth: true
    });

    const resizeWindow = (e) => {
        setPageSize([document.body.clientWidth, document.body.clientHeight])
    }

    useEffect(() => {
        resizeWindow()
    }, [])

    useEffect(() => {
        window.addEventListener("resize", resizeWindow);
        return () => { window.removeEventListener("resize", resizeWindow); }
    }, [])

    function rowRenderer({ index, isScrolling, key, parent, style }) {
        return (
            <CellMeasurer
                cache={cache}
                columnIndex={0}
                key={key}
                parent={parent}
                rowIndex={index}
            >
                {({ measure, registerChild }) => (
                    <div ref={registerChild} style={style}>
                        <ImageRender
                            onLoad={measure}
                            src={props.urls[index]}
                            style={{ width: "100%" }}
                        />
                    </div>
                )}
            </CellMeasurer>
        );
    }


    return <div style={{ width: "100vw", height: "100vh" }}>
        <List
            width={pageSize[0]}
            height={pageSize[1]}
            rowCount={props.urls.length}
            deferredMeasurementCache={cache}
            rowHeight={cache.rowHeight}
            rowRenderer={rowRenderer}
        />
    </div>
}