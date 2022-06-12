import { useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { notifyMessage } from "./PopoverNotifier";
const dispatchEvent = (eventName, detail) => {
    const e = new Event("globalActionHandelerEvent");
    e.key = eventName;
    e.detail = detail;
    window.dispatchEvent(e);
}

const requestApi = async (url, onSuccess, onError) => {
    const resp = await fetch(url)
    if (resp.ok) {
        const json = await resp.json()
        onSuccess(json)
    } else {
        const text = await resp.text()
        try {
            const info = JSON.parse(text)
            onError(JSON.parse(info.detail))
        } catch (error) {
            onError(text)
        }
    }
}

export function testAction(obj) {
    requestApi("/gallarys/2160228_aebb21d52c/g_data.json",
        (result) => {
            dispatchEvent("testAction", { obj: obj, result: result })
        },
        (errorText) => {
            dispatchEvent("testAction", { obj: obj, errorText: errorText })
        }
    )
}

export function addFavo(gid, token, index) {
    const reportSuccess = () => {
        // notifyMessage("success", "收藏成功")
        dispatchEvent("addFavo", {
            gid: gid,
            token: token,
            index: index,
            success: true
        })
    }
    const reportError = (error) => {
        notifyMessage("error", error)
        dispatchEvent("addFavo", {
            gid: gid,
            token: token,
            index: index,
            success: false
        })

    }
    requestApi(`/addfavo/${gid}_${token}/${index}`,
        (result) => {
            if (result.msg === "success") {
                reportSuccess()
            } else {
                reportError("收藏失败")
            }
        },
        (errorText) => {
            reportError(errorText)
        }
    )
}

export function rmFavorite(gid, token) {
    const reportSuccess = () => {
        // notifyMessage("success", "取消收藏成功")
        dispatchEvent("rmFavo", {
            gid: gid,
            token: token,
            success: true
        })
    }
    const reportError = (error) => {
        notifyMessage("error", error)
        dispatchEvent("rmFavo", {
            gid: gid,
            token: token,
            success: false
        })

    }
    requestApi(`/rmfavo/${gid}_${token}`,
        (result) => {
            if (result.msg === "success") {
                reportSuccess()
            } else {
                reportError("取消收藏失败")
            }
        },
        (errorText) => {
            reportError(errorText)
        }
    )
}

export function addDownload(gid, token) {
    const reportSuccess = () => {
        notifyMessage("success", "已添加到下载队列")
        dispatchEvent("addDownload", {
            gid: gid,
            token: token,
            success: true
        })
    }
    const reportError = (error) => {
        notifyMessage("error", error)
        dispatchEvent("addDownload", {
            gid: gid,
            token: token,
            success: false
        })
    }
    requestApi(`/download/${gid}_${token}`,
        (result) => {
            reportSuccess()
        },
        (errorText) => {
            reportError(errorText)
        }
    )
}
export function rmDownload(gid, token) {
    const reportSuccess = () => {
        notifyMessage("success", "删除成功")
        dispatchEvent("rmDownload", {
            gid: gid,
            token: token,
            success: true
        })
    }
    const reportError = (error) => {
        notifyMessage("error", error)
        dispatchEvent("rmDownload", {
            gid: gid,
            token: token,
            success: false
        })
    }
    requestApi(`/delete/${gid}_${token}`,
        (result) => {
            reportSuccess()
        },
        (errorText) => {
            reportError(errorText)
        }
    )
}

export function useActionHandeler(func, actions) {
    const handeler = (e) => {
        if (actions.indexOf(e.key) !== -1) {
            func(e.detail)
        }
    }
    useEffect(() => {
        window.addEventListener("globalActionHandelerEvent", handeler)
        return () => {
            window.removeEventListener("globalActionHandelerEvent", handeler)
        }
    }, [])
}

//画廊同步hook 当服务器画廊发生变化时同步
export function useSyncGallarys() {
    const [gallarys, setGallarys] = useState([])
    const handelGallaryChange = (result) => {
        setGallarys(result)
    }
    useActionHandeler(handelGallaryChange, ["syncGallarys"])
    return gallarys
}

export function useSyncState() {
    const [state, setState] = useState({})
    const handelStateChange = (result) => {
        setState(result)
    }
    useActionHandeler(handelStateChange, ["syncState"])
    return state
}

export function ServerSyncKeepAlive(props) {
    //指定一个refreshKey
    //当refreshKey发生变化时，向服务器发送请求

    const ws = useRef(null)
    
    
    
    const initWs = () => {
        if (ws.current != null )return
        const wssOrWS = window.location.protocol === "https:" ? "wss:" : "ws:"
        let wsUrl = `${wssOrWS}//${window.location.host}/ws`
        if (window.location.host.includes("3000")) {
            wsUrl = wsUrl.replace("3000", "8080")
        }
        ws.current = new ReconnectingWebSocket(wsUrl)
        
        ws.current.onmessage = (msg) => {
            const data = JSON.parse(msg.data)
            if (!data.hasOwnProperty("gallarys") || !data.hasOwnProperty("state")) return
            dispatchEvent("syncState", data.state)
            if (data.gallarys.length > 0) {
                dispatchEvent("syncGallarys", data.gallarys)
            }
        }
        
        ws.current.onopen = () => {
            try {
                ws.current.send(props.gid ? "syncState" : "syncAll")
            } catch (e) {
                console.log("ws error", ws.current.state)
            }
        }

        ws.current.onerror = (e) => {
            console.log("ws error", e)
        }

        ws.current.onclose = () => {
            console.log("ws close")
        }
    }
    useEffect(() => {
        initWs()
        return () => {
            try{
                ws.current.close()
                ws.current = null
            }catch(e){
                console.log("ws close error", e)
            }
        }
    }, [])

    useEffect(() => {
        if (ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(props.gid ? "syncState" : "syncAll")
        }
    }, [props.refreshKey])
    return <div />
}