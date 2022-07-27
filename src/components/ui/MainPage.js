
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CachedIcon from '@mui/icons-material/Cached';
import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileDownloadOffIcon from '@mui/icons-material/FileDownloadOff';
import HomeIcon from '@mui/icons-material/Home';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LogoDevIcon from '@mui/icons-material/LogoDev';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import FloatSpeedDial from './MainPageComponents/FloatSpeedDial';
import LeftMenu from './MainPageComponents/LeftMenu';
import LongClickMenu from './MainPageComponents/LongClickMenu';
import TopSearchBar from './MainPageComponents/TopSearchBar';
import VScrollCardContainer from './MainPageComponents/VScrollCardContainer';
import { notifyMessage } from '../utils/PopoverNotifier';
import SecondConfirmDialog from '../utils/SecondConfirmDialog';
import { getSetting, useSettingBind } from '../utils/SettingHooks';
import syncedDB from '../utils/mobxSyncedState';
import { observer } from "mobx-react";
import { addFavorite, continueDownload, deleteGallery, downloadGallery, fetchGalleryList, removeFavorite } from '../api/serverApi';
import { autorun, toJS } from 'mobx';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import { useVisualViewport } from '../utils/MyHooks';


const removeAndInsert = (oldState, newState) => {
    const oldSet = new Set(oldState)
    const newSet = new Set(newState)
    const fileted = oldState.filter(item => newSet.has(item))
    const newAdd = newState.filter(item => oldSet.has(item) === false)
    return [...newAdd, ...fileted]
}


const randomSort = (arr) => {
    console.log("randomSortArray")
    return arr.sort(() => Math.random() - 0.5)
}

const nameSort = (arr, dict) => {
    const nameDict = {}
    const firstShow = []
    for (let item of arr) {
        const hashName = dict[item].name.replace(/\[.*?\]|\(.*?\)|【.*?】|（.*?）|\s+/g, "")
        if (nameDict[hashName] !== undefined) {
            if (dict[item].lang === "chinese") {
                //如果是中文画廊，则放在前面
                nameDict[hashName].unshift(item)
            } else {
                //其他语言画廊，则放在后面
                nameDict[hashName].push(item)
            }
        } else {
            nameDict[hashName] = [item]
        }
        if (firstShow.indexOf(hashName) === -1) {
            firstShow.push(hashName)
        }
    }
    const newList = []
    for (let hashName of firstShow) {
        newList.push(...nameDict[hashName])
    }
    return newList
}

const mergeAndDistinct = (arr1, arr2) => {//arr1 和 arr2 不去重
    const arr1Set = new Set(arr1)
    return [...arr1,
    ...arr2.filter(item => !arr1Set.has(item))
    ]
}

function MainPage_inner(props) {


    const [cardGidList, setCardGidList] = useState([])
    const [cardInfoMap, setCardInfoMap] = useState({})
    const downloadCount = useRef(0)
    const pageOffset = useRef(0)
    const lock = useRef(false)
    const [loading, setLoading] = useState(false)

    const syncDBToHooks = (
        forceUpdate,
        download_key_set,
        download,
        card_info
    ) => {
        for (let gid_key of download_key_set) {
            if (!card_info[gid_key]) {
                console.log("download与card_info数据未同步 跳过", gid_key)
                return
            }
        }

        if (!forceUpdate) {
            if (download_key_set.size === downloadCount.current) {//长度没有改变 即不是删除或者添加 忽略
                console.log("长度没有改变 跳过")
                return
            }
        }
        downloadCount.current = download_key_set.size

        const indexedDownload = []
        Object.values(download).forEach(item => {
            indexedDownload[item.index] = item.gid
        })

        const newCardList = indexedDownload.filter(item => item !== undefined).reverse()

        if (forceUpdate) {
            console.log("强制更新", newCardList.length)
            setCardInfoMap(toJS(card_info))
            setCardGidList(newCardList)
        } else {
            setCardInfoMap(toJS(card_info))
            console.log("更新", cardGidList.length, newCardList.length)
            setCardGidList((old) => removeAndInsert(old, newCardList))
        }
    }



    const requestData = async () => {
        if (props.downloadPage) {
            syncDBToHooks(
                true,
                toJS(syncedDB.keys.download),
                syncedDB.download,
                syncedDB.card_info
            )
            lock.current = false
            setLoading(false)
        } else {
            if (lock.current) return
            lock.current = true
            const prevProps = JSON.stringify(props)
            setLoading(true)
            const [data, error] = await fetchGalleryList(props.apiURL, pageOffset.current)
            if (error) {
                notifyMessage("error", error)
                lock.current = false
                setLoading(false)
                return false
            } else {
                if (prevProps !== JSON.stringify(props)) {
                    console.log("props changed, ignore response")
                    return
                } else {
                    console.log(data)
                    const dataDict = {}
                    const dataGidList = data.map(item => item.gid)
                    data.forEach(item => { dataDict[item.gid] = item })
                    setCardInfoMap(prev => { return { ...prev, ...dataDict } })
                    setCardGidList(prev => mergeAndDistinct(prev, dataGidList))
                    pageOffset.current += 1
                    lock.current = false
                    setLoading(false)
                    return true
                }
            }
        }
    }

    const initClearAll = () => {
        setLoading(false)
        lock.current = false
        setCardGidList([])
        setCardInfoMap({})
        pageOffset.current = 0
    }

    useEffect(() => {
        initClearAll()
        requestData()
    }, [
        props.initSearch,
        props.apiURL,
        props.downloadPage
    ])

    useEffect(() => {
        console.log("useEffect 注册autorun")
        autorun(
            () => {
                console.log("autorun 触发", typeof syncedDB.keys.download, typeof syncedDB.download, typeof syncedDB.card_info)
                if (!props.downloadPage) {
                    console.log("autorun 不是下载页面 退出")
                    return
                }
                console.time("autorun 同步数据库到hooks")
                syncDBToHooks(
                    false,
                    toJS(syncedDB.keys.download),
                    syncedDB.download,
                    syncedDB.card_info
                )
                console.timeEnd("autorun 同步数据库到hooks")
            }
        )
    }, [])

    const lastTop = useRef(0);
    const scrollTop = useRef(0)
    const [scrollControlledHidden, setScrollControlledHidden] = useState(false)
    const setScrollTop = (value) => {
        scrollTop.current = value
        if (scrollTop.current > lastTop.current) {
            setScrollControlledHidden(true)
        } else {
            setScrollControlledHidden(false)
        }
        lastTop.current = scrollTop.current;
    }

    const [refreshToken, setRefreshToken] = useState(Math.random())

    const [deleteSecondConfirm, setDeleteSecondConfirm] = useState({})
    const handelSecondConfirm = (gid, token, title) => {
        setDeleteSecondConfirm({
            title: title,
            open: true,
            onConfirm: () => {
                deleteGallery(gid, token)
                setDeleteSecondConfirm({})
            },
            handleClose: () => { setDeleteSecondConfirm({}) }
        })
    }

    const [leftMenuOpen, setLeftMenuOpen] = useState(false)
    const [pos, setPos] = useState([-1, -1])
    const [longClickItems, setLongClickItems] = useState([])
    const [longClickedName, setLongClickedName] = useState("")
    const handelLongClick = (gid, token, name, favorited, canDelete, canContinue, x, y) => {
        setLongClickItems([
            { text: "阅读", onClick: () => { props.openRead(gid, token) }, icon: <AutoStoriesIcon /> },

            canContinue ? { text: "继续下载", onClick: () => { downloadGallery(gid, token) }, icon: <FileDownloadIcon /> } : null,

            canDelete ? { text: "删除下载", onClick: () => { handelSecondConfirm(gid, token, name) }, icon: <FileDownloadOffIcon /> }
                : { text: "下载", onClick: () => { downloadGallery(gid, token) }, icon: <FileDownloadIcon /> },

            favorited ? { text: "取消收藏", onClick: () => { removeFavorite(gid, token) }, icon: <FavoriteBorderIcon /> }
                : { text: "收藏", onClick: () => { addFavorite(gid, token, getSetting("收藏夹", 9)) }, icon: <FavoriteIcon /> }
        ])
        setLongClickedName(name)
        setPos([x, y])
    }

    const action_goTop = {
        name: "回到顶部",
        icon: <ArrowUpwardIcon />,
        onClick: () => { setRefreshToken(Math.random()) }
    }
    const action_randomSort = {
        name: "随机排序",
        icon: <ShuffleIcon />,
        onClick: () => { setCardGidList((state) => randomSort(state)); setRefreshToken(Math.random()) }
    }
    const action_nameHashSort = {
        name: "名称排序",
        icon: <SortByAlphaIcon />,
        onClick: () => {
            setCardGidList((state) => nameSort(state, cardInfoMap)); setRefreshToken(Math.random())
        }
    }
    const action_refresh = {
        name: "刷新",
        icon: <CachedIcon />,
        onClick: () => { }
    }
    const action_continueDownload = {
        name: "",
        icon: <PlayArrowIcon />,
        onClick: () => { continueDownload() }
    }


    const normalActions = [ action_goTop , action_randomSort , action_nameHashSort, action_refresh]
    const downloadPageActions = [action_continueDownload, action_goTop, action_randomSort, action_nameHashSort,]




    let leftMenuItems = [
        {
            onClick: () => { props.openURL("/", "") },
            icon: <HomeIcon />,
            text: "主页"
        }, {
            onClick: () => { props.openURL("/watched", "") },
            icon: <SubscriptionsIcon />,
            text: "订阅"
        }, {
            onClick: () => { props.openURL("/popular", "") },
            icon: <LocalFireDepartmentIcon />,
            text: "热门"
        }, {
            onClick: () => { props.openURL("/favorites", "") },
            icon: <FavoriteIcon />,
            text: "收藏"
        },
        {
            onClick: () => { props.openURL("/downloaded", "") },
            icon: <DownloadIcon />,
            text: "下载"
        },
        {
            onClick: () => { props.openURL("/uploadZip", "") },
            icon: <FolderZipIcon />,
            text: "导入"
        },
        {
            onClick: () => { props.openURL("/setting", "") },
            icon: <SettingsIcon />,
            text: "设置"
        }
    ]

    const [searchFocus,setSearchFocus] = useState(false)
    const [searchValue,setSearchValue] = useState(props.initSearch)

    return (
        <React.Fragment >
            <FloatSpeedDial
                actions={props.downloadPage ? downloadPageActions : normalActions}
                hidden={scrollControlledHidden}
                searchFocus={searchFocus}
                doSearch={() => { props.openURL("/search", `&f_search=${searchValue}`) }}
            />
            <SecondConfirmDialog {...deleteSecondConfirm} />
            <LongClickMenu
                pos={pos}
                setPos={setPos}
                items={longClickItems}
                title={longClickedName}
            />
            <LeftMenu
                open={leftMenuOpen}
                onClose={() => setLeftMenuOpen(false)}
                Items={leftMenuItems}
            />
            <TopSearchBar
                leftButtonClick={() => setLeftMenuOpen(true)}
                doSearch={ () => { props.openURL("/search", `&f_search=${searchValue}`) } }
                hidden={scrollControlledHidden}
                initText={props.initSearch}
                searchValue={searchValue}
                setSearchValue={  setSearchValue }
                searchFocus={searchFocus}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
            />
            <VScrollCardContainer
                key={refreshToken}
                cardGidList={cardGidList}
                cardInfoMap={cardInfoMap}
                setScrollTop={setScrollTop}
                loading={loading}
                onImageClick={props.openRead}
                onLongClick={handelLongClick}
                onCardClick={props.openGallery}
                onReachEnd={requestData}
            />
        </React.Fragment>
    )
}


const ItemsObserver = observer(MainPage_inner);

function MainPage(props) {
    return <div>
        <ItemsObserver {...props} />
    </div>
}

export default MainPage;
