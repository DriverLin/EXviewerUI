import { getSetting } from "../utils/SettingHooks"
import {notifyMessage} from "../utils/PopoverNotifier"
//这些API都是会造成数据变化的 即not pure
//其他都是pure 
//但也可以考虑在这做个warper 调用方便些

const notifyError = (error) => {
    notifyMessage("error", String(error))
}

const notifySuccess = (msg) => {
    notifyMessage("success",msg)
}

const Get = async (url) => {
    const response = await fetch(url);
    if (response.ok) {
        return [await response.json(), null];
    } else {
        const text = await response.text()
        try {
            const info = JSON.parse(text)
            return [null, info.detail];
        } catch (error) {
            return [null, text];
        }
    }
}

const fetchWithoutCallback = async (url) => {
    const [result, error] = await Get(url)
    if (error) {
        notifyError(error)
    } else {
        notifySuccess(result.msg)
    }
}

const addFavorite = async (gid, token, index) => {
    fetchWithoutCallback(`/addFavorite/${gid}/${token}/${index}`)
}

const removeFavorite = async (gid, token) => {
    fetchWithoutCallback(`/rmFavorite/${gid}/${token}`)
}

const downloadGallery = async (gid, token) => {
    fetchWithoutCallback(`/download/${gid}/${token}`)
    if (getSetting("下载时添加收藏",false)){
        const defaultIndex = getSetting("收藏夹",9)
        addFavorite(gid, token,defaultIndex)
    }
}

const deleteGallery = async (gid, token) => {
    fetchWithoutCallback(`/delete/${gid}/${token}`)
    if(getSetting("删除时移除收藏",false)){
        removeFavorite(gid,token)
    }
}

const continueDownload = async () => {
    fetchWithoutCallback(`/continueDownload`)
}

export {
    addFavorite,
    removeFavorite,
    downloadGallery,
    deleteGallery,
    continueDownload
}