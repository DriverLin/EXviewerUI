import { getSetting } from "../utils/SettingHooks"
import { notifyMessage } from "../utils/PopoverNotifier"
import syncedDB, { FAVORITE_STATE } from "../utils/mobxSyncedState"

//这些API都是会造成数据变化的 即not pure
//其他都是pure 
//但也可以考虑在这做个warper 调用方便些

const notifyError = (error) => {
    notifyMessage("error", error)
}

const notifySuccess = (msg) => {
    notifyMessage("success", msg)
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

const Post = async (url,json) => {
    const response = await fetch(url, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(json),
    })
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
    if (getSetting("下载时添加收藏", false)) {
        if (syncedDB.favorite[gid] && syncedDB.favorite[gid]["state"] === FAVORITE_STATE.FAVORITED) {
            return//已收藏 则返回
        } else {
            const defaultIndex = getSetting("收藏夹", 9)
            addFavorite(gid, token, defaultIndex)
        }
    }
}

const deleteGallery = async (gid, token) => {
    fetchWithoutCallback(`/delete/${gid}/${token}`)
    if (getSetting("删除时移除收藏", false)) {
        if (syncedDB.favorite[gid] && syncedDB.favorite[gid]["state"] != FAVORITE_STATE.NOT_FAVORITED) {
            removeFavorite(gid, token)//已收藏 才能删除
        }
    }
}

const continueDownload = async () => {
    fetchWithoutCallback(`/continueDownload`)
}


const rateGallery = async (gid, token, score) => {
    const [result, error] = await Get(`/rateGallery/${gid}/${token}/${score}`)
    if (error) {
        notifyError(error)
    }
    return [result, error]
}


// http://localhost:7964/voteComment/2265543/52b25aea73/4740004/1
const voteComment = async (gid, token, commentId, vote) => {
    const [result, error] = await Get(`/voteComment/${gid}/${token}/${commentId}/${vote}`)
    if (error) {
        notifyError(error)
    }
    return [result, error]
}

const postComment = async (gid, token, content, edit, commentID) => {
    const [result, error] = await Post("/postComment",{
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


export {
    addFavorite,
    removeFavorite,
    downloadGallery,
    deleteGallery,
    continueDownload,
    rateGallery,
    voteComment,
    postComment
}