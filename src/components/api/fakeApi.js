import { getSetting } from "../utils/SettingHooks"
import { notifyMessage } from "../utils/PopoverNotifier"
import syncedDB, { FAVORITE_STATE } from "../utils/mobxSyncedState"
import { getStringHash } from "../utils/tools"
import jsonData from "./fakeData.json"

//封装了所有与服务器交互的api

const fix8 = (num) => (Array(8).join(0) + num).slice(-8)
const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms)
})

const notifyError = (error) => {
    notifyMessage("error", error)
}

const notifySuccess = (msg) => {
    notifyMessage("success", msg)
}

const Get = async (url) => {
    await sleep(300)
    return [null, ["此站点仅作演示"]]
}

const Post = async (url, json) => {
    await sleep(300)
    return [null, ["此站点仅作演示"]]
}

const addFavorite = async (gid, token, index) => {
    notifyError(["此站点仅作演示"])
}

const removeFavorite = async (gid, token) => {
    notifyError(["此站点仅作演示"])
}

const downloadGallery = async (gid, token) => {
    notifyError(["此站点仅作演示"])
}

const deleteGallery = async (gid, token) => {
    notifyError(["此站点仅作演示"])
}

const continueDownload = async () => {
    notifyError(["此站点仅作演示"])
}


const rateGallery = async (gid, token, score) => {
    const [result, error] = await Get(`/rateGallery/${gid}/${token}/${score}`)
    if (error) {
        notifyError(error)
    }
    return [result, error]
}


const voteComment = async (gid, token, commentId, vote) => {
    const [result, error] = await Get(`/voteComment/${gid}/${token}/${commentId}/${vote}`)
    if (error) {
        notifyError(error)
    }
    return [result, error]
}

const postComment = async (gid, token, content, edit, commentID) => {
    const [result, error] = await Post("/postComment", {
        "gid": gid,
        "token": token,
        "content": content,
        "edit": edit,
        "commentID": commentID
    })
    if (error) {
        notifyError(error)
    }
    return [result, error]
}


const fetchG_Data = async (gid, token, ignoreCache) => {
    if(ignoreCache){
        await sleep(1000)
    }
    if(jsonData["g_data"][gid]){
        return [jsonData["g_data"][gid], null]
    }else{
        return [null, ["没有找到相关画廊"]]
    }
}

const fetchComment = async (gid, token, all) => {
    if(jsonData["comments"][gid]){
        return [jsonData["comments"][gid], null]
    }else{
        return [null, ["没有找到相关画廊"]]
    }
}

const fetchDiskCacheSize = async () => {
    return [{ "msg": "0MB" }, null]
}

const requestClearDiskCache = async () => {
    return [{ "msg": "0MB" }, null]
}

const fetchGalleryList = async (apiURL, pageIndex) => {
    await sleep(1000)
    return [jsonData["fetchGalleryList"][pageIndex % jsonData["fetchGalleryList"].length], null]
}

const getRandomImg = (index) => {
    return `./samples/${index % 7}.jpg`
}

const getPreviewImgUrl = (gid, token, index) => {
    return getRandomImg(index)
}

const getCoverUrl = (gid, token) => {
    return getRandomImg(getStringHash(`${gid}_${token}`))
}

const getGalleryImgUrl = (gid, token, index) => {
    return getRandomImg(index)
}



export {
    addFavorite,
    removeFavorite,

    downloadGallery,
    deleteGallery,
    continueDownload,

    rateGallery,

    voteComment,
    postComment,


    fetchG_Data,
    fetchComment,

    fetchDiskCacheSize,
    requestClearDiskCache,

    fetchGalleryList,

    getPreviewImgUrl,
    getCoverUrl,
    getGalleryImgUrl,

}