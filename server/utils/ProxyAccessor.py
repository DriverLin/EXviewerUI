
import json
import os
import re
import threading
import time
import urllib.error
import urllib.request
from urllib.parse import parse_qs, urljoin

import requests
from bs4 import BeautifulSoup
from cacheout import LRUCache

from utils.DownloadManager import DownloadManager
from utils.EHDBManager import EHDBManager
from utils.MulthreadCache import MulthreadCache
from utils.tools import (atomWarpper, checkImg, logger, makeTrackableExcption,
                         printPerformance, printTrackableException,
                         timestamp_to_str)

cache = MulthreadCache()


class ProxyAccessor:
    def __init__(
        self, root, headers, coverPath, cachePath, gallaryPath, dbPath, downloadNotifyer
    ):
        self.root = root
        self.headers = headers
        self.cachedMap = LRUCache(maxsize=512, ttl=60, default=None)

        self.coverPath = coverPath
        self.cachePath = cachePath
        self.gallaryPath = gallaryPath

        self.downloadNotifyer = downloadNotifyer

        self.dbm = EHDBManager(dbPath)
        self.downloadManager = DownloadManager(
            self.dbm,
            self.g_data_official,
            self.get_img,
            self.get_cover,
            self.getReport,
            self.gallaryPath,
            self.coverPath
        )

    def setCache(self, gid, token, key, value):
        self.cachedMap.add("{}_{}:{}".format(gid, token, key), value)

    def getCache(self, gid, token, key):
        return (
            self.cachedMap.get("{}_{}:{}".format(gid, token, key))
            if self.cachedMap.has("{}_{}:{}".format(gid, token, key))
            else None
        )

    @printPerformance
    def queryDownloaded(self):
        results = []
        gids = self.dbm.listDownload()
        for gid in gids:
            g_data = self.dbm.getGdata(gid)
            g_data["extended"] = {
                "download": self.getDownloadExtendvalue(gid),
                "favo": self.getLocalFavoValue(gid)
            }
            results.append(g_data)
        return results

    def downloadImgFile(self, url, filePath):
        bytes = None
        try:
            bytes = urllib.request.urlopen(url, timeout=15).read()
        except Exception as e:
            logger.error(e.__str__())
            raise makeTrackableExcption(e, f"图片下载失败{filePath}")
        if checkImg(bytes):
            with open(filePath, "wb") as f:
                f.write(bytes)
        else:
            raise Exception(f"图片已下载部分检查不通过{filePath}")  # 可能是服务器端图片错误

    def addFavorite(self, gid, token, index):
        params = (
            ("gid", gid),
            ("t", token),
            ("act", "addfav"),
        )

        data = {"favcat": str(index), "favnote": "", "update": "1"}
        try:
            response = requests.post(
                "https://exhentai.org/gallerypopups.php",
                headers=self.headers,
                params=params,
                data=data,
            )
            self.dbm.addFavo(int(gid), int(index))
            self.getReport(0)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"添加收藏 失败{e.__str__()}")
            return False

    def rmFavorite(self, gid, token):
        params = (
            ("gid", gid),
            ("t", token),
            ("act", "addfav"),
        )

        data = {
            "favcat": "favdel",
            "favnote": "",
            "apply": "Apply Changes",
            "update": "1",
        }
        try:
            response = requests.post(
                "https://exhentai.org/gallerypopups.php",
                headers=self.headers,
                params=params,
                data=data,
            )
            self.dbm.rmFavo(int(gid))
            self.getReport(0)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"删除收藏 失败{e.__str__()}")
            return False

    @ cache.memoize
    def _getHtml(self, url):
        try:
            return self._getHtml_ignore_cache(url)
        except Exception as e:
            raise e

    @printPerformance
    def _getHtml_ignore_cache(self, url):
        try:
            req = urllib.request.Request(
                url=urljoin(self.root, url), headers=self.headers
            )
            resp = urllib.request.urlopen(req, timeout=8)
            return resp.read().decode("utf-8")
        except urllib.error.URLError as e:
            raise makeTrackableExcption(e, f"获取HTML{url} 失败 ")

    def getLocalFavoValue(self, gid):
        return self.dbm.getFavo(gid)

    def getDownloadExtendvalue(self, gid):
        return self.dbm.getDownload(gid)

    @printPerformance
    def g_data_from_pageHtml(self, gid, token):
        try:
            html = self.get_gallary_html_ignore_cache(gid, token)
        except Exception as e:
            raise makeTrackableExcption(e, f"从html获取g_data {gid}_{token} 失败 ")
        try:
            pageElem = BeautifulSoup(html, features="html.parser")
            urlSplit = pageElem.select_one(
                "td.ptds > a").get("href").split("/")
            gid = int(urlSplit[-3])
            token = urlSplit[-2]
            archiver_key = "None"
            title = pageElem.select_one("#gn").text
            title_jpn = pageElem.select_one("#gj").text
            category = pageElem.select_one("#gdc > div").text
            thumb = (
                pageElem.select_one("#gd1 > div")
                .get("style")
                .split("(")[1]
                .split(")")[0]
            )
            uploader = pageElem.select_one("#gdn").text
            posted = int(
                time.mktime(
                    time.strptime(
                        pageElem.select_one(
                            "#gdd > table > tr:nth-child(1) > td.gdt2"
                        ).text,
                        "%Y-%m-%d %H:%M",
                    )
                )
            )
            filecount = pageElem.select_one(
                "#gdd > table > tr:nth-child(6) > td.gdt2 "
            ).text.split(" ")[0]

            fileSizeText, fileSizeUnit = pageElem.select_one(
                "#gdd > table > tr:nth-child(5) > td.gdt2"
            ).text.split(" ")
            filesize = int(
                float(fileSizeText)
                * {"KB": 1024, "MB": 1048576, "GB": 1073741824}[fileSizeUnit]
            )
            expunged = (
                pageElem.select_one(
                    "#gdd > table > tr:nth-child(3) > td.gdt2 ").text
                != "Yes"
            )
            rating = pageElem.select_one("#rating_label").text.split(" ")[1]
            torrentcount = (
                pageElem.select_one("#gd5 > p:nth-child(3) > a")
                .text.split("(")[1]
                .split(")")[0]
            )
            torrents = []
            tags = []
            for row in pageElem.select("#taglist > table > tr"):
                rowname = row.select_one("td.tc").text
                tags.extend(
                    [rowname + x.text for x in row.select("td > div > a")])

            favoText = pageElem.select_one("#favoritelink").text
            favo = -1
            if favoText != " Add to Favorites":
                style = pageElem.select_one("#fav > div.i").get("style")
                postion = style.split(
                    "background-position:0px ")[1].split("px;")[0]
                favoNum = ["-2", "-21", "-40", "-59", "-78", "-97",
                           "-116", "-135", "-154", "-173"].index(postion)
                favo = favoNum
                self.dbm.addFavo(gid, favo)
            else:
                self.dbm.rmFavo(gid)
                # 爬取的时候 同步更新数据库
                # 这个是画廊更新
                # 再主页爬取的时候也会更新
                # 且如果目标值相同 不会修改
            g_data = {
                "gid": gid,
                "token": token,
                "archiver_key": archiver_key,
                "title": title,
                "title_jpn": title_jpn,
                "category": category,
                "thumb": thumb,
                "uploader": uploader,
                "posted": posted,
                "filecount": filecount,
                "filesize": filesize,
                "expunged": expunged,
                "rating": rating,
                "torrentcount": torrentcount,
                "torrents": torrents,
                "tags": tags,
                "extended": {
                    "favo": favo,  # -1:未收藏 0-9:收藏夹编号
                    # -2:未下载 -1:下载中 0-n:下载完成数量
                    "download": self.getDownloadExtendvalue(gid),
                },
            }
            self.setCache(gid, token, "g_data", g_data)
            self.setCache(
                gid, token, "cover", g_data["thumb"].replace(
                    "exhentai.org", "ehgt.org")
            )
            return g_data
        except Exception as e:
            raise makeTrackableExcption(e, f"从html创建g_data 页面解析失败,{html}")

    def g_data_official(self, gid, token):
        try:
            apiUrl = urljoin(self.root, "/api.php")
            r = (
                urllib.request.urlopen(
                    urllib.request.Request(
                        url=apiUrl,
                        data=json.dumps(
                            {
                                "method": "gdata",
                                "gidlist": [[gid, token]],
                                "namespace": 1,
                            }
                        ).encode("UTF-8"),
                        headers=self.headers,
                    )
                )
                .read()
                .decode("utf-8")
            )
            g_data = json.loads(r)["gmetadata"][0]
            self.setCache(
                gid, token, "cover", g_data["thumb"].replace(
                    "exhentai.org", "ehgt.org")
            )  # 只有下载时 才会请求官方API 紧接着就会需要下载封面
            return g_data
        except Exception as e:
            raise makeTrackableExcption(e, f"官方API获取g_data {gid}_{token} 失败")

    def get_g_data(self, gid, token):
        if self.getCache(gid, token, "g_data") != None:
            logger.info(f"get g_data from cache {gid}_{token}")
            return self.getCache(gid, token, "g_data")
        queryres = self.dbm.getGdata(gid)
        if queryres:
            query_g_data = queryres
            query_g_data["extended"] = {
                "favo": self.getLocalFavoValue(gid),
                "download": self.getDownloadExtendvalue(gid),
            }
            self.setCache(gid, token, "g_data", query_g_data)
            # logger.info(f"get g_data from db {gid}_{token}")
            return query_g_data
        try:
            g_data = self.g_data_from_pageHtml(gid, token)
            self.setCache(gid, token, "g_data", g_data)
            self.setCache(
                gid, token, "cover", g_data["thumb"].replace(
                    "exhentai.org", "ehgt.org")
            )
            logger.info(f"get g_data from pageHtml {gid}_{token}")
            return g_data
        except Exception as e:
            raise makeTrackableExcption(e, f"获取g_data {gid}_{token} 失败 ")

    def get_main_gallarys(self, url=""):
        html = None
        try:
            logger.info(f"获取主页 url={url}")
            html = BeautifulSoup(
                self._getHtml_ignore_cache(url), features="html.parser"
            )
        except Exception as e:
            raise makeTrackableExcption(e, f"获取主页画廊列表失败 url={url}")

        infos = []
        mainElem = html.select("div.gl1t")
        for elem in mainElem:
            herf = elem.select_one("a:nth-child(1)").get("href")
            gid = herf.split("/")[-3]
            token = herf.split("/")[-2]
            rawSrc = (
                elem.select_one("div.gl3t > a > img")
                .get("src")
                .replace("exhentai.org", "ehgt.org")
            )
            self.setCache(gid, token, "cover", rawSrc)
            nameElem = elem.select_one("div.gl4t.glname.glink") or elem.select_one(
                "span.glink"
            )
            name = nameElem.text
            rankText = elem.select("div.gl5t > div:nth-child(2) > div:nth-child(1)")[
                0
            ].get("style")
            rankText.replace("background-position:0px -21px;opacity:1", "")
            rankValue = re.findall("-?[0-9]+px -?[0-9]+px", rankText)[0]
            rank_a, rank_b = re.findall("-?[0-9]+px", rankText)
            rank_a = int(rank_a[:-2])
            rank_b = int(rank_b[:-2])
            rankValue = (5 - int(rank_a / -16)) * 2
            if rank_b == -21:  # -21半星
                rankValue -= 1
            category = elem.select_one(
                "div.gl5t > div:nth-child(1) > div:nth-child(1)"
            ).text
            uploadtime = elem.select_one(
                "div.gl5t > div > div:nth-child(2)").text

            favo = (
                elem.select_one(
                    "div.gl5t > div > div:nth-child(2)").get("style")
                != None
            )  # 获取到远程画廊是收藏的 但是此时不能获取到编号
            localFavo = self.getLocalFavoValue(gid)  # 本地收藏情况
            if favo and localFavo == -1:  # 爬取时显示远程收藏了 但是本地没有记录 则新增记录999
                self.dbm.addFavo(gid, 999)

            lang = elem.select_one("div.gl6t > div")
            lang = lang.text if lang is not None else ""
            pages = elem.select_one(
                "div.gl5t > div:nth-child(2) > div:nth-child(2)"
            ).text.split(" ")[0]
            infos.append(
                {
                    "gid": gid,
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "name": name,
                    "rank": rankValue / 2,
                    "category": category,
                    "uploadtime": uploadtime,
                    "lang": lang,
                    "pages": pages,
                    # 999代表收藏 但是不确定收藏夹编号 (其实可以知道名称)
                    "favo": self.dbm.getFavo(gid),
                    "download": self.getDownloadExtendvalue(gid),
                }
            )
        return infos

    # @printPerformance
    def get_cover(self, gid, token):
        filename = "{}_{}.jpg".format(gid, token)
        cachedCover = os.path.join(self.cachePath, filename)
        downloadCover = os.path.join(self.coverPath, filename)
        if os.path.exists(downloadCover):  # 存在 则一定通过检查 就不需要多此一举了
            # logger.debug(f"封面 {filename} 已下载")
            return downloadCover
        elif os.path.exists(cachedCover):
            # logger.debug(f"封面 {filename} 已缓存")
            return cachedCover
        else:
            url = self.getCache(gid, token, "cover")
            if url is None:
                # logger.debug(f"封面 {filename} 从页面获取中...")
                try:
                    g_data = self.get_g_data(gid, token)
                    url = g_data["thumb"].replace("exhentai.org", "ehgt.org")
                except Exception as e:
                    logger.error(f"封面 {filename} 从页面获取失败")
                    raise makeTrackableExcption(e, f"封面 {filename} 下载失败")
            try:
                self.downloadImgFile(url, cachedCover)
                # logger.debug(f"封面 {filename} 下载完成")
                return cachedCover
            except Exception as e:
                logger.error(f"封面 {filename} 下载失败")
                raise makeTrackableExcption(e, f"封面 {filename} 下载失败")

    def get_gallary_html(self, gid, token, index=0):
        page_key = "P_{}".format(index)
        cached = self.getCache(gid, token, page_key)
        if cached != None:
            return cached
        try:
            return self.get_gallary_html_ignore_cache(gid, token, index)
        except Exception as e:
            raise makeTrackableExcption(e, f"获取页面{gid}_{token}:{index} 失败")

    @printPerformance
    def get_gallary_html_ignore_cache(self, gid, token, index=0):
        page_key = "P_{}".format(index)
        url = "/g/{}/{}/?p={}".format(gid, token, index)
        try:
            result = self._getHtml_ignore_cache(url)
            self.setCache(gid, token, page_key, result)
            return result
        except Exception as e:
            # raise e
            raise makeTrackableExcption(e, f"忽略缓存获取页面{gid}_{token}:{index} 失败")

    def get_preview(self, gid, token, index):
        html = None
        try:
            html = self.get_gallary_html(gid, token, (index - 1) // 20)
        except Exception as e:
            # raise Exception(f"{e.__str__()}\n预览图 {gid}_{token}:{index} 画廊页面获取失败")
            raise makeTrackableExcption(
                e, f"预览图 {gid}_{token}:{index} 画廊页面获取失败")
        soup = BeautifulSoup(html, features="html.parser")
        picUrl = (
            soup.select("div.gdtl > a > img")[(index - 1) % 20]
            .get("src")
            .replace("exhentai.org", "ehgt.org")
        )
        try:
            return urllib.request.urlopen(picUrl).read()
        except Exception as e:
            raise makeTrackableExcption(e, f"预览图 {gid}_{token}:{index} 数据下载失败")

    @printPerformance
    def get_comment(self, gid, token):
        html = None
        logger.debug(f"获取评论 {gid}_{token}")
        try:
            html = self.get_gallary_html(gid, token)
        except Exception as e:
            raise makeTrackableExcption(e, f"评论 {gid}_{token} 画廊页面获取失败")
        try:
            result = []
            for comment in BeautifulSoup(html, features="html.parser").select("div.c1"):
                score = comment.select("div.c5.nosel > span")
                if len(score) == 0:
                    score = ""
                else:
                    score = score[0].text
                raw_comment_text = str(comment.select_one("div.c6"))
                comment_text = raw_comment_text
                comment_text = comment_text.replace(
                    "https://exhentai.org/g/", "/#/g/")
                comment_text = comment_text.replace(
                    "https://exhentai.org/t/", "https://ehgt.org/t/"
                )
                comment_text = comment_text.replace(
                    "<a href=", '<a target="_blank" href='
                )

                comment_bref = comment.select_one("div.c6").text

                if len(comment_bref) > 40:
                    comment_bref = comment_bref[:40] + "..."
                poster = comment.select_one("div.c3 > a").text
                post_date = comment.select_one(
                    "div.c3").text.split(" by: ")[0][10:]
                result.append(
                    {
                        "poster": poster,
                        "post_date": post_date,
                        "score": score,
                        "text": comment_text,
                        "bref": comment_bref,
                    }
                )
            return result
        except Exception as e:
            raise makeTrackableExcption(e, f"获取评论 html解析失败,{html}")

    @printPerformance
    def get_img(self, gid, token, index):
        formatedindex = "{0:08d}".format(int(index))
        filename = "{}_{}_{}.jpg".format(gid, token, formatedindex)
        cachePath = os.path.join(self.cachePath, filename)
        if os.path.exists(cachePath):
            logger.debug(f"图片 {gid}_{token}:{index} 已缓存")
            return cachePath
        localPath = os.path.join(
            self.gallaryPath,
            os.path.join("{}_{}".format(gid, token),
                         "{}.jpg".format(formatedindex)),
        )

        if os.path.exists(localPath):
            logger.debug(f"图片 {gid}_{token}:{index} 已下载")
            return localPath
        html = None
        logger.debug(f"获取图片 {gid}_{token}:{index}")
        try:
            html = self.get_gallary_html(gid, token, (index - 1) // 20)
        except Exception as e:
            raise makeTrackableExcption(
                e, f"获取图片 {gid}_{token}:{index} 画廊页面获取失败")

        soup = BeautifulSoup(html, features="html.parser")
        pageUrl = (
            soup.select("div.gdtl > a")[(index - 1) % 20]
            .get("href")
            .replace("https://exhentai.org/", "")
        )

        pageHtml = None
        try:
            pageHtml = self._getHtml_ignore_cache(pageUrl)
        except Exception as e:
            raise makeTrackableExcption(
                e, f"获取图片 {gid}_{token}:{index} 图片页面获取失败")

        skipHathKey = re.findall(
            r"onclick=\"return nl\('([^\)]+)'\)", pageHtml)
        if len(skipHathKey) != 0:
            skipHathKey = skipHathKey[0]
        else:
            skipHathKey = ""

        pageSoup = BeautifulSoup(pageHtml, features="html.parser")
        imgSrc = pageSoup.select_one("#img").get("src")

        flag = False
        try:
            self.downloadImgFile(imgSrc, cachePath)
            flag = True
        except Exception as e:
            flag = False

        if flag == False:
            pageUrl = pageUrl + "?nl=" + skipHathKey
            logger.debug(
                f"图片 {gid}_{token}:{index} 下载失败 ,  尝试跳过h@h  Url = {pageUrl}")
            try:
                pageHtml = self._getHtml(pageUrl)
                pageSoup = BeautifulSoup(pageHtml, features="html.parser")
                imgSrc = pageSoup.select_one("#img").get("src")
                self.downloadImgFile(imgSrc, cachePath)
            except Exception as e:
                raise makeTrackableExcption(
                    e, f"获取图片 {gid}_{token}:{index} 跳过h@h失败")
        return cachePath

    def download(self, gid, token):
        try:
            self.downloadManager.addDownload(gid, token)
        except Exception as e:
            raise makeTrackableExcption(e, f"添加下载失败")


    def deleteDownload(self, gid, token):
        self.downloadManager.deleteDownloaded(gid, token)

    def listLog(self):
        return self.downloadManager.listLog()

    def downloadMany(self, gid_token_list):
        for (gid, token) in gid_token_list:
            try:
                self.download(gid, token)
            except Exception as e:
                printTrackableException(e)

    def reDownloadAllFailed(self):
        gid_tokens = []
        for gid in self.dbm.listDownload():
            rec = self.dbm.getDownloadREC(gid)
            if rec:
                over = rec["over"]
                g_data = self.dbm.getGdata(gid)
                if g_data and over == int(g_data["filecount"]):
                    pass
                else:
                    gid_tokens.append((gid, rec["token"]))    
            else:
                logger.error(f"严重错误 {gid} 没有记录")
        threading.Thread(target=self.downloadMany, args=(gid_tokens,)).start()
        return gid_tokens

    def check_search(self,g_data, words, tags):
        for word in words:
            if word not in g_data["title"] and word not in g_data["title_jpn"]:
                return False
        for tag in tags:
            if tag not in g_data["tags"]:
                return False
        # logger.debug(f"{json.dumps(g_data, ensure_ascii=False,indent=4)}")
        return True


    def localSearch(self, query):
        str = parse_qs(query)['f_search'][0]
        tagRe = '[A-Za-z0-9]+:"[^\$]+\$"'
        wordRe = '[\u0800-\u4e00\u4E00-\u9FA5A-Za-z0-9_]+'
        tags = []
        for tagRes in re.findall(tagRe, str):
            str = str.replace(tagRes, '')
            tags.append(re.sub('\$|"', '', tagRes))
        words = re.findall(wordRe, str)

        result = []

        logger.info(f"localSearch words: {json.dumps(words, ensure_ascii=False)}")
        logger.info(f"localSearch tags: {json.dumps(tags)}")

        for gid in self.dbm.listDownload():
            g_data = self.dbm.getGdata(gid)
            if(g_data):
                if self.check_search(g_data, words, tags):
                    token = g_data["token"]
                    result.append(
                        {
                            "gid": f"{gid}",
                            "token": token,
                            "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                            "name": g_data["title_jpn"] if g_data["title_jpn"] != "" else g_data["title"],
                            "rank": float(g_data["rating"]),
                            "category": g_data["category"],
                            "uploadtime": timestamp_to_str("%Y-%m-%d %H:%M",  int(g_data["posted"])),
                            "download": self.getDownloadExtendvalue(gid),
                            "favo": self.getLocalFavoValue(gid),
                            "lang": "chinese" if "language:chinese" in g_data["tags"] else "",
                            "pages": g_data["filecount"],
                        }
                    )

        return result


    def getStauseForWS(self):
        downloading_gid = self.downloadManager.downloading_gid
        return self.dbm.getState(downloading_gid)

    def getDownloadedForWS(self):
        result = []
        for _gid in self.dbm.listDownload():
            g_data = self.dbm.getGdata(_gid)
            if g_data:
                pass
            else:
                logger.error(f"g_data is None for gid: {_gid}")
                rec = self.dbm.getDownloadREC(_gid)
                if rec:
                    token = rec["token"]
                    g_data = self.get_g_data(_gid, token)
                else:
                    logger.error(f"rec is None for gid: {_gid}")
                    continue
            gid = g_data["gid"]
            token = g_data["token"]
            result.append(
                {
                    "gid": f"{gid}",
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "name": g_data["title_jpn"] if g_data["title_jpn"] != "" else g_data["title"],
                    "rank": float(g_data["rating"]),
                    "category": g_data["category"],
                    "uploadtime": timestamp_to_str("%Y-%m-%d %H:%M",  int(g_data["posted"])),
                    "lang": "chinese" if "language:chinese" in g_data["tags"] else "",
                    "pages": int(g_data["filecount"]),
                }
            )
        return result

    def makeSyncData(self, msg):
        if msg == "syncState":
            return [{
                "state": self.getStauseForWS(),
                "gallarys": []
            }]
        elif msg == "syncAll":
            return [{
                "state": self.getStauseForWS(),
                "gallarys": self.getDownloadedForWS()
            }]
        else:
            return []

    def getReport(self, type=0):
        self.downloadNotifyer(self.makeSyncData(
            "syncState" if type == 0 else "syncAll"))
