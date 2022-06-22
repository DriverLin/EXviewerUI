
import asyncio
from genericpath import exists
from importlib.resources import path
from io import BytesIO
import json
import os
from os.path import join as path_join
import shutil
from typing import List
from unittest import result
from urllib.parse import parse_qs
from zipfile import ZipFile

from aiohttp import ClientSession, ClientTimeout
from async_timeout import timeout
from cacheout import LRUCache
from tinydb import Query
from utils.AsyncCacheWarper import AsyncCacheWarper
from utils.DBM import EHDBM, DOWNLOAD_STATE, FAVORITE_STATE
from utils.DownloadManager import downloadManager
from utils.HTMLParser import *
from utils.tools import checkImg, logger, makeTrackableException


class NOSQL_DBS():
    def __init__(self, g_data_dbm: EHDBM, download_dbm: EHDBM, favorite_dbm: EHDBM, card_info_dbm: EHDBM) -> None:
        self.g_data = g_data_dbm
        self.download = download_dbm
        self.favorite = favorite_dbm
        self.card_info = card_info_dbm


class aoiAccessor():
    def __init__(
        self,
        headers: object,
        coverPath: str,
        cachePath: str,
        galleryPath: str,
        db: NOSQL_DBS,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        self.headers = headers
        self.coverPath = coverPath
        self.cachePath = cachePath
        self.galleryPath = galleryPath
        self.cache_html = LRUCache(maxsize=512,   default=None)
        self.cache_cardInfo = LRUCache(maxsize=512, default=None)
        # 下载时可以用， 获取g_data 然后更新数据库和此cache
        # 注意这个与数据库的cardInfo格式不同的 是他的超集
        self.cache_g_data = LRUCache(maxsize=512, default=None)

        self.proxy = os.environ.get("HTTP_PROXY", "")
        if self.proxy != "":
            logger.info(f"使用代理 {self.proxy}")
        self.db = db
        self.loop = loop
        self.downloadManagerInstance = downloadManager(self)
        self.session = ClientSession()  # loop=loop

        self.loop.create_task(self.inlineSetOnInit())

    async def inlineSetOnInit(self):
        try:
            await self.getHtml("https://exhentai.org/?inline_set=ts_l", cached=False)
        except Exception as e:
            logger.error(f"set / to Thumbnail failed: {e}")

        try:
            await self.getHtml("https://exhentai.org/?inline_set=dm_t", cached=False)
        except Exception as e:
            logger.error(f"set /g/ to large failed: {e}")

    def __del__(self):
        self.session.close()

    def getUrlTTL(self, url):
        if '.org/g/' in url:
            return None
        elif '.org/s/' in url:
            return 60
        else:
            return None

    @AsyncCacheWarper(cacheContainer=LRUCache(maxsize=512, ttl=3, default=None),)
    async def getHtmlAlwaysCache(self, url: str):
        # cache 但是ttl极短
        # 仅用于短时间内大量请求
        # 需要外部函数调用 并单独缓存
        try:
            resp = await self.session.get(
                url,
                headers=self.headers,
                proxy=self.proxy,
                timeout=ClientTimeout(total=8)
            )
            html = await resp.text()
            removeIndex = html.find("<html")
            if removeIndex != -1:
                html = html[removeIndex:]
            return html
        except Exception as e:
            raise e

    async def getHtml(self, url: str, cached=True):
        '''
        默认使用缓存
        '''
        if cached and self.cache_html.has(url):
            return self.cache_html.get(url)
        try:
            result = await self.getHtmlAlwaysCache(url)
            self.cache_html.set(
                key=url,
                value=result,
                ttl=self.getUrlTTL(url)
            )
            return result
        except Exception as e:
            raise makeTrackableException(e, f"getHtml({url})")

    async def downloadImgBytes(self, url: str):
        '''
        下载url 返回bytes
        '''
        try:
            resp = await self.session.get(
                url,
                headers=self.headers,
                proxy=self.proxy,
                timeout=ClientTimeout(total=8)
            )
            return await resp.read()
        except Exception as e:
            raise makeTrackableException(e, f"download({url}) -> bytes failed")

    async def downloadImg(self, url, filePath):
        bytes = None
        try:
            bytes = await self.downloadImgBytes(url)
        except Exception as e:
            raise makeTrackableException(
                e, f"downloadImgBytes({url}, {filePath})")
        if checkImg(bytes):
            with open(filePath, "wb") as f:
                f.write(bytes)
        else:
            raise Exception(f"checkImg({filePath})")  # 可能是服务器端图片错误

    # @printPerformance
    def updateLocalFavorite(self, gid: int, index: int):
        # logger.info(f"self.db.favorite[{gid}]({type(gid)}) = {self.db.favorite[gid]}")
        if index == -1:
            if self.db.favorite[gid] != None:
                logger.info(f"{gid} 删除本地收藏")
                del self.db.favorite[gid]
                return
        else:
            if self.db.favorite[gid] == None:
                logger.info(f"{gid} 添加本地收藏记录 index={index}")
                self.db.favorite[gid] = {
                    'gid': gid, 'state': FAVORITE_STATE.FAVORITED, 'index': index}
                return

            if self.db.favorite[gid]['index'] != index:
                logger.info(f"{gid} 更新本地收藏记录 index={index}")
                self.db.favorite[gid]['index'] = index
                return

    async def addFavorite(self, gid, token, index) -> None:
        url = f'https://exhentai.org/gallerypopups.php?gid={gid}&t={token}&act=addfav'
        data = {"favcat": str(index), "favnote": "", "update": "1"}
        try:
            prev = self.db.favorite[gid]
            self.db.favorite[gid] = {
                'gid': gid, 'state': FAVORITE_STATE.FETCHING, 'index': index}
            response = await self.session.post(
                url=url,
                headers=self.headers,
                data=data,
                proxy=self.proxy,
                timeout=ClientTimeout(total=8),
            )
            await response.text()
            if response.ok:
                self.db.favorite[gid] = {
                    'gid': gid, 'state': FAVORITE_STATE.FAVORITED, 'index': index}
            else:
                self.db.favorite[gid] = prev
                raise Exception(
                    f"addFavorite({gid}, {index}) response.code={response.status_code}")
        except Exception as e:
            self.db.favorite[gid] = prev
            raise Exception(makeTrackableException(
                e, f"addFavorite({gid}, {index})"))

    async def rmFavorite(self, gid, token) -> None:
        url = f'https://exhentai.org/gallerypopups.php?gid={gid}&t={token}&act=addfav'
        data = {"favcat": "favdel",  "favnote": "",
                "apply": "Apply Changes",     "update": "1", }
        try:
            prev = self.db.favorite[gid]
            self.db.favorite[gid] = {
                'gid': gid, 'state': FAVORITE_STATE.FETCHING, 'index': 999}
            response = await self.session.post(
                url=url,
                headers=self.headers,
                data=data,
                proxy=self.proxy,
                timeout=ClientTimeout(total=8),
            )
            await response.text()
            if response.ok and self.db.favorite[gid] != None:
                del self.db.favorite[gid]
            else:
                if prev != None:
                    self.db.favorite[gid] = prev
                raise Exception(
                    f"rmFavorite({gid},{token}) response.code={response.status_code}")
        except Exception as e:
            if prev != None:
                self.db.favorite[gid] = prev
            raise Exception(makeTrackableException(
                e, f"rmFavorite({gid},{token})"))

    async def fetchG_dataOfficial(self, gidList) -> List[object]:  # 只有下载才用得到
        try:
            resp = await self.session.post(
                url="https://exhentai.org/api.php",
                json={
                    "method": "gdata",
                    "gidlist": gidList,
                    "namespace": 1,
                },
                headers=self.headers,
                proxy=self.proxy,
                timeout=ClientTimeout(total=8),
            )
            text = await resp.text()
            g_data_list = json.loads(text)["gmetadata"]
            for item in g_data_list:
                self.cache_g_data.set(int(item["gid"]), item)
            return g_data_list
        except Exception as e:
            raise e

    async def get_G_data(self, gid, token, cached):
        # 虽然说是G_DATA 实际上并不是官方的接口
        # 普通请求直接用
        # 画廊请求带nocache的时候 记得cache=False
        if cached and self.cache_g_data.has(gid):
            logger.info(f"cache hit {gid}")
            return self.cache_g_data.get(gid)
        dbSearch = self.db.g_data[gid]
        if cached and dbSearch != None:
            self.cache_g_data.set(gid, dbSearch)
            logger.info(f"query success {gid}")
            return dbSearch
        logger.info(f"get_G_data({gid}) from html")
        try:
            html = await self.getHtml(f"https://exhentai.org/g/{gid}/{token}/?p=0", cached=cached)
            g_data = getG_dataFromGalleryPage(html)
            self.updateLocalFavorite(gid, g_data['extended']['favoriteIndex'])
            self.cache_g_data.set(gid, g_data)
            return g_data
        except Exception as e:
            raise makeTrackableException(
                e, f"get_G_data({gid}, {token}, {cached})")

    async def getGalleryCoverIgnoreError(self, gid, token):
        try:
            return await self.getGalleryCover(gid, token)
        except Exception as e:
            logger.warning(f"getGalleryCoverIgnoreError({gid}, {token}) {e}")

    def updateCardCacheAndFavorite(self, cardInfos):
        for cardInfo in cardInfos:
            self.cache_cardInfo.set(cardInfo['gid'], cardInfo)
            self.updateLocalFavorite(
                cardInfo['gid'], cardInfo['favoriteIndex'])
            self.loop.create_task(self.getGalleryCoverIgnoreError(
                cardInfo['gid'], cardInfo['token']))

    # @printPerformance
    async def getMainPageGalleryCardInfo(self, url: str):
        '''
        获取主页面的卡片信息
        '''
        try:
            html = await self.getHtml(url, cached=False)
            cardInfos = parseMainPage(html)
            self.updateCardCacheAndFavorite(cardInfos)
            return cardInfos
        except Exception as e:
            raise makeTrackableException(
                e, f"getMainPageGalleryCardInfo({url})")

    async def getComments(self, gid, token, fetchAll=False):
        try:
            if fetchAll:
                html = await self.getHtml(f"https://exhentai.org/g/{gid}/{token}/?hc=1#comments", cached=True)
            else:
                html = await self.getHtml(f"https://exhentai.org/g/{gid}/{token}/?p=0", cached=True)
            return getCommentsFromGalleryPage(html)
        except Exception as e:
            raise makeTrackableException(
                e, f"getComments({gid}, {token}, {fetchAll})")

    def parseG_dataToCardInfo(self, g_data):
        return {
            "gid": g_data['gid'],
            "token": g_data['token'],
            "imgSrc": "/cover/{}_{}.jpg".format(g_data['gid'], g_data['token']),
            "rawSrc": g_data['thumb'],
            "name": g_data['title_jpn'] or g_data['title'],
            "rank": g_data['rating'],
            "category": g_data['category'],
            "uploadTime": timestamp_to_str("%Y-%m-%d %H:%M",  int(g_data["posted"])),
            "lang": "chinese" if "language:chinese" in g_data["tags"] else "",
            "pages": g_data["filecount"],
            # 用于刷新本地状态 前端用不到 因为前端靠全局状态判断favorite和download
            "favoriteIndex": self.db.favorite[g_data['gid']]['index'] if self.db.favorite[g_data['gid']] else -1,
        }

    @printPerformance
    def localSearch(self, query):
        str = parse_qs(query)['f_search'][0]
        tagRe = '[A-Za-z0-9]+:"[^\$]+\$"'
        wordRe = '[\u0800-\u4e00\u4E00-\u9FA5A-Za-z0-9_]+'
        tags = []
        for tagRes in re.findall(tagRe, str):
            str = str.replace(tagRes, '')
            tags.append(re.sub('\$|"', '', tagRes))
        words = re.findall(wordRe, str)

        logger.info(
            f"localSearch words: {json.dumps(words, ensure_ascii=False)}")
        logger.info(f"localSearch tags: {json.dumps(tags)}")

        def checkTitle(title):
            for word in words:
                if word not in title:
                    return False
            return True
        downloadedGid = self.db.download.keys()
        return sorted(
            [
                self.parseG_dataToCardInfo(g_data)
                for g_data in self.db.g_data.search(
                    (Query().tags.all(tags))
                    & ((Query().title.test(checkTitle)) | Query().title_jpn.test(checkTitle))
                    & (Query().gid.one_of(downloadedGid)))
            ],
            key=lambda x: self.db.download[x['gid']]['index'],
            reverse=True
        )

    async def getGalleryImage(self, gid, token, index) -> str:  # index 从一开始
        cachePath = path_join(self.cachePath, f"{gid}_{token}_{index:08d}.jpg")
        if os.path.exists(cachePath):
            return cachePath
        localPath = path_join(self.galleryPath,  path_join(
            "{}_{}".format(gid, token), f"{index:08d}.jpg"),)
        if os.path.exists(localPath):
            return localPath
        try:
            galleryPageUrl = f"https://exhentai.org/g/{gid}/{token}/?p={(index - 1) // 20}"
            galleryPageHtml = await self.getHtml(galleryPageUrl, cached=True)
            viewInfo = getViewInfoFromPage(galleryPageHtml)
            viewPageUrl, _ = viewInfo[(index-1) % 20]
            viewPageHtml = await self.getHtml(viewPageUrl, cached=True)
            skipHathKey, imgSrc = getInfoFromViewingPage(viewPageHtml)
            # 获取galleryPage并获取viewPage
            # 两个有一个出错都直接raise
        except Exception as e:
            raise makeTrackableException(
                e, f"getGalleryImage({gid}, {token}, {index})")
        try:
            await self.downloadImg(imgSrc, cachePath)
            # 下载成功则直接返回
            return cachePath
        except Exception as e:
            # 失败 则报错 然后尝试skipHathKey
            logger.warning(
                f"downloadImg {cachePath} failed, try to download using skipHathKey")
        try:
            skipHathKeyViewPageUrl = viewPageUrl + "?nl=" + skipHathKey
            skipHathKeyViewPageHtml = await self.getHtml(skipHathKeyViewPageUrl, cached=True)
            _, skipHathKeyImgSrc = getInfoFromViewingPage(
                skipHathKeyViewPageHtml)
            await self.downloadImg(skipHathKeyImgSrc, cachePath)
            logger.info(f"downloadImg {cachePath} using skipHathKey success")
            return cachePath
        except Exception as e:
            logger.error(
                f"downloadImg {cachePath} using skipHathKey failed")
            raise makeTrackableException(
                e, f"getGalleryImage({gid}, {token}, {index})")

    async def getGalleryPreview(self, gid, token, index) -> bytes:
        try:
            galleryPageUrl = f"https://exhentai.org/g/{gid}/{token}/?p={(index - 1) // 20}"
            galleryPageHtml = await self.getHtml(galleryPageUrl, cached=True)
            _, previewSrc = getViewInfoFromPage(
                galleryPageHtml)[(index-1) % 20]
            return await self.downloadImgBytes(previewSrc)
        except Exception as e:
            raise makeTrackableException(
                e, f"getGalleryPreview({gid}, {token}, {index})")

    # @printPerformance
    @AsyncCacheWarper(cacheContainer=LRUCache(maxsize=512, ttl=1, default=None),)
    async def getGalleryCover(self, gid, token) -> str:
        cachePath = path_join(self.cachePath, f"{gid}_{token}.jpg")
        if os.path.exists(cachePath):
            return cachePath
        downloadPath = path_join(self.coverPath, f"{gid}_{token}.jpg")
        if os.path.exists(downloadPath):
            return downloadPath
        try:
            if self.cache_cardInfo.has(gid):
                src = self.cache_cardInfo.get(gid)['rawSrc'].replace(
                    "exhentai.org", "ehgt.org")
                await self.downloadImg(src, cachePath)
                return cachePath
            if self.cache_g_data.has(gid):
                src = self.cache_g_data.get(gid)['thumb'].replace(
                    "exhentai.org", "ehgt.org")
                await self.downloadImg(src, cachePath)
                return cachePath
            g_data = await self.get_G_data(gid, token, cached=True)
            src = g_data['thumb'].replace("exhentai.org", "ehgt.org")
            await self.downloadImg(src, cachePath)
            return cachePath
        except Exception as e:
            raise makeTrackableException(e, f"getGalleryCover({gid}, {token})")

    async def addDownload(self, gidList) -> None:
        for (gid, token) in gidList:
            await self.downloadManagerInstance.addDownload(int(gid), token, None)

    async def deleteDownload(self, gidList) -> None:
        for (gid, token) in gidList:
            await self.downloadManagerInstance.deleteDownload(int(gid), token)

    async def continueDownload(self) -> int:
        g_data_table = self.db.g_data.getDict()
        downloadTable = self.db.download.getDict()
        unFinishList = []
        for gid in downloadTable:
            if downloadTable[gid]['state'] != DOWNLOAD_STATE.FINISHED:
                continue
            if gid in g_data_table and downloadTable[gid]['success'] == int(g_data_table[gid]['filecount']):
                continue
            else:
                unFinishList.append(
                    (downloadTable[gid]['gid'], downloadTable[gid]['token']))
        g_data_map = {(gid, token): None for (gid, token) in unFinishList}
        # 数组分割成25个一组
        splittedUnFinishList = [unFinishList[i:i+25]
                                for i in range(0, len(unFinishList), 25)]
        for gidList in splittedUnFinishList:
            for g_data in await self.fetchG_dataOfficial(gidList):
                g_data_map[(g_data['gid'], g_data['token'])] = g_data
        for (gid, token) in unFinishList:
            await self.downloadManagerInstance.addDownload(
                int(gid), token, g_data_map[(gid, token)])
        # print(f"unFinishList: {}")
        return len(unFinishList)

    async def updateCardInfo(self, gid: int, token: str):
        logger.debug(f"updateCardInfo({gid}, {token})")
        if self.cache_cardInfo.has(gid):
            cachedCard = self.cache_cardInfo.get(gid)
            self.db.card_info[gid] = {
                'gid': gid,
                'token': token,
                'name': cachedCard['name'],
                'rank': cachedCard['rank'],
                'category': cachedCard['category'],
                'uploadTime': cachedCard['uploadTime'],
                'lang': cachedCard['lang'],
                'pages': cachedCard['pages']
            }
            logger.debug(f"updateCardInfo({gid}, {token}) from cached card")
        else:
            try:
                g_data = await self.get_G_data(gid, token, cached=True)
                self.db.card_info[gid] = {
                    'gid': g_data['gid'],
                    'token': g_data['token'],
                    'name': g_data['title_jpn'] or g_data['title'],
                    'category': g_data['category'],
                    'uploadTime': time.strftime("%Y-%m-%d %H:%M", time.localtime(int(g_data['posted']))),
                    'lang': 'chinese' if 'language:chinese' in g_data['tags'] else '',
                    'rank': g_data['rating'],
                    'pages': int(g_data['filecount'])
                }
                logger.debug(f"updateCardInfo({gid}, {token}) from get_G_data")
            except Exception as e:
                logger.error(f"updateCardInfo({gid}, {token}) failed")
                pass

    # @printPerformance
    def getNowDownloadIndex(self) -> int:
        indexList = [item["index"]
                     for item in self.db.download.getDict().values()]
        if len(indexList) == 0:
            return 0
        return max(indexList) + 1

    def getDiskCacheSize(self) -> str:
        size = sum(os.path.getsize(path_join(self.cachePath, file))
                   for file in os.listdir(self.cachePath))
        return f"{size / 1024 / 1024:.2f} MB"

    def clearDiskCache(self) -> str:
        size = self.getDiskCacheSize()
        shutil.rmtree(self.cachePath)
        os.makedirs(self.cachePath)
        return size

    async def addDownloadRecordFromZip(self, gid, token, zipBytes):
        extNames = ["jpg", "JPG", "png", "PNG", "gif", "GIF"]
        z = ZipFile(BytesIO(zipBytes))
        files = [file for file in z.filelist if file.filename.split(
            ".")[-1] in extNames]
        files.sort(key=lambda x: x.filename)
        extractDir = path_join(self.cachePath, f"{gid}_{token}_extract")
        z.extractall(extractDir)
        for index, file in enumerate(files):
            cachePath = path_join(
                self.cachePath, f"{gid}_{token}_{(index+1):08d}.jpg")
            extractedPath = path_join(extractDir, file.filename)
            shutil.move(extractedPath, cachePath) if not os.path.exists(
                cachePath) else None
            logger.debug(f"mv {extractedPath} -> {cachePath}")
        await self.addDownload([[gid, token]])

    async def reUpdateLocalG_data(self, count=0):
        '''
        更新本地g_data表与文件夹内的g_data.json
        count: 更新的数量 从最新的开始向后检查
        '''
        download_rec = self.db.download.getDict().values()
        if count == 0:
            gidList = sorted(
                download_rec, key=lambda x: x['index'], reverse=True)
        else:
            gidList = sorted(download_rec, key=lambda x: x['index'], reverse=True)[
                :count]
        splittedList = [gidList[i:i+25] for i in range(0, len(gidList), 25)]
        for recList in splittedList:
            try:
                res = await self.fetchG_dataOfficial([[rec['gid'], rec['token']] for rec in recList])
                for g_data in res:
                    if json.dumps(self.db.g_data[g_data['gid']]) == json.dumps(g_data):
                        logger.debug(
                            f"g_data of {g_data['gid']} is up to date")
                    else:
                        logger.debug(f"g_data of {g_data['gid']} updated")
                        self.db.g_data[g_data['gid']] = g_data
                        saveDir = path_join(
                            self.galleryPath, f"{g_data['gid']}_{g_data['token']}")
                        g_data_json_save_path = path_join(
                            saveDir, "g_data.json")
                        with open(g_data_json_save_path, "w", encoding="utf-8") as f:
                            json.dump(g_data, f, ensure_ascii=True, indent=4)
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"reUpdateLocalG_data failed {str(e)}")
                pass

    async def rateGallery(self, gid: int, token: str, score: float):
        json_data = {
            'method': 'rategallery',
            'apiuid': 3245653,
            'apikey': '94ba22ab762645b63cbb',
            'gid': gid,
            'token': token,
            'rating': int(score*2),
        }
        try:
            response = await self.session.post(
                url='https://exhentai.org/api.php',
                headers=self.headers,
                json=json_data,
                proxy=self.proxy,
                timeout=ClientTimeout(total=8),
            )
            if response.ok:
                result = json.loads(await response.text())
                return {
                    "averageRating": result["rating_avg"],
                    "ratingCount": result["rating_cnt"],
                    "userRankColor": CLASS_RATING_COLOR_MAP[result["rating_cls"]],
                    "userRankValue": result["rating_usr"]
                }
            else:
                raise Exception(
                    f"rateGallery({gid},{token}) response.code={response.status_code}")
        except Exception as e:
            raise makeTrackableException(e, f"rateGallery({gid},{token})")
