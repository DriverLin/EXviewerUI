import asyncio
import json
import logging
import os
import queue
import re
import shutil
import sqlite3
import ssl
import threading
import time
from turtle import down
import urllib.request
import urllib.error
from typing import List
from urllib.parse import urljoin,parse_qs

import coloredlogs
import requests
import uvicorn
from bs4 import BeautifulSoup
from cacheout import LRUCache
from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    Response,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

ssl._create_default_https_context = ssl._create_unverified_context


logger = logging.getLogger(f'{"main"}:{"loger"}')
fmt = f"%(asctime)s.%(msecs)03d .%(levelname)s \t%(message)s"
coloredlogs.install(
    level=logging.DEBUG, logger=logger, milliseconds=True, datefmt="%X", fmt=fmt
)



def printTrackableException(e):
    try:
        for excTrack in json.loads(str(e)):
            logger.error(str(excTrack))
        logger.info("=" * 40)
    except Exception as e:
        logger.error(str(e))
        logger.info("=" * 40)


def makeTrackableExcption(e, appendE):
    try:
        exceptions = json.loads(str(e))
        exceptions.append(str(appendE))
        return Exception(json.dumps(exceptions))
    except Exception as jsonError:
        return Exception(json.dumps([str(e), str(appendE)]))


def printPerformance(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        logger.debug(f"{func.__name__}{args[1:]} 耗时 {end - start}")
        return result

    return wrapper


def atomWarpper(func):
    lock = threading.Lock()

    def f(*args, **kwargs):
        lock.acquire()
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            raise e
        finally:
            lock.release()
        return result

    return f


def asyncWarpper(func):
    async def wrapper(*args, **kwargs):
        return await asyncio.get_event_loop().run_in_executor(
            None, func, *args, **kwargs
        )

    return wrapper


def checkImg(img):
    if img == None:
        return False
    lastBytes = b""
    if type(img) == str:
        if not os.path.exists(img):
            return False
        else:
            f = open(img, "rb")
            f.seek(-2, 2)
            lastBytes = f.read()
            f.close()
    elif type(img) == bytes:
        lastBytes = img[-2:]
    else:
        logger.warning("checkImg: unknow arg type", type(img))
    return lastBytes in [b"\xff\xd9", b"\x60\x82", b"\x00\x3b"]

def timestamp_to_str(formatstr, timestamp):
    return time.strftime(formatstr, time.localtime(timestamp))


class multhread_cache(object):  # 等重写吧。。。
    def __init__(self):
        self.cache = LRUCache(maxsize=256, ttl=60, default=None)
        self.locks = {}

    def memoize(self, func):
        def newFunc(*arg, **kwargs):
            key = (func, arg)
            value = self.cache.get(key)
            if value != None:
                return value  # 已缓存 直接返回
            lock = self.locks.get(key)  # 没有缓存 尝试获取lock
            if lock == None:
                self.locks[key] = threading.Lock()
                lock = self.locks[key]  # 没有lock 则是第一次执行 创建lock
            lock.acquire()  # 等待其他线程执行完毕
            value = self.cache.get(key)
            if value != None:
                lock.release()
                return value  # 如果能获取到结果 则返回
            else:
                try:
                    value = func(*arg, **kwargs)
                    self.cache.set(key, value)
                    lock.release()
                    return value  # 执行原函数 获取结果 设置缓存 解锁 返回结果
                except Exception as e:
                    self.cache.set(key, None)
                    lock.release()  # 异常 设置缓存为None 解锁
                    raise e

        return newFunc


cache = multhread_cache()


class JobScheduler(object):
    def __init__(
        self, handeler, maxParallel=5, onChange=lambda action, info, result: None
    ):
        # handeler不允许报错
        #  出错直接用闭包的方式处理
        self.queue = []  # 任务队列 [并行? 标签 任务]
        self.queueSemaphore = threading.Semaphore(0)  # 队列信号量 等于长度 用于控制调度线程读取任务
        self.lock = threading.Lock()  # 锁 用于控制队列的读写
        self.handeler = handeler  # 执行器 外部传入
        self.MAXPARALLEL = maxParallel  # 最大并行数
        self.parallelJobs = threading.Semaphore(self.MAXPARALLEL)  # 并行任务信号量 用于控制并行任务数量
        self.jobsRunning = threading.Lock()  # 当前是否有任务正在运行   并行任务不可与串行任务同时运行
        self.handelingJobs = {}
        self.onChange = onChange  # 当任务发生变化时调用 包括添加 删除 修改

        def shdule_thread():
            @atomWarpper
            def add_handelingJob(key, jobInfo):
                self.handelingJobs[key] = jobInfo
                self.onChange("running", jobInfo, None)

            @atomWarpper
            def finish_handelingJob(key, jobInfo, result):
                if key in self.handelingJobs:
                    del self.handelingJobs[key]
                    self.onChange("finished", jobInfo, result)

            while True:
                [job, tag, parallel] = self.get_job()

                if parallel:
                    self.parallelJobs.acquire()

                    def run_thread():
                        jobInfo = {
                            "job": job,
                            "tag": tag,
                            "parallel": parallel,
                            "timestamp": time.time(),
                        }
                        key = id(job)
                        add_handelingJob(key, jobInfo)
                        result = self.handeler(job)
                        finish_handelingJob(key, jobInfo, result)
                        self.parallelJobs.release()

                    threading.Thread(target=run_thread).start()
                else:
                    [self.parallelJobs.acquire() for _ in range(self.MAXPARALLEL)]
                    jobInfo = {
                        "job": job,
                        "tag": tag,
                        "parallel": parallel,
                        "timestamp": time.time(),
                    }
                    key = id(job)
                    add_handelingJob(key, jobInfo)
                    result = self.handeler(job)
                    finish_handelingJob(key, jobInfo, result)
                    [self.parallelJobs.release() for _ in range(self.MAXPARALLEL)]

        threading.Thread(target=shdule_thread).start()

    def add_job(self, job, tag, parallel=False):
        self.lock.acquire()
        self.queue.append([job, tag, parallel])
        self.onChange("add", [[job, tag, parallel]], None)
        self.lock.release()
        self.queueSemaphore.release()

    def add_jobs(self, jobs):
        self.lock.acquire()
        for [job, tag, parallel] in jobs:
            self.queue.append([job, tag, parallel])
            self.queueSemaphore.release()
        self.onChange("add", jobs, None)
        self.lock.release()

    def insert_job(self, job, tag, parallel=False):
        self.lock.acquire()
        self.queue.insert(0, [job, tag, parallel])
        self.onChange("insert", [[job, tag, parallel]], None)
        self.lock.release()
        self.queueSemaphore.release()

    def get_job(self):
        self.queueSemaphore.acquire()
        self.lock.acquire()
        [job, tag, parallel] = self.queue.pop(0)
        self.lock.release()
        return [job, tag, parallel]

    def rm_job(self, tag):
        self.lock.acquire()
        original_len = len(self.queue)
        self.queue = [job for job in self.queue if job[1] != tag]
        [self.queueSemaphore.acquire() for _ in range(original_len - len(self.queue))]
        self.onChange("remove", tag, None)
        self.lock.release()

    def listJobs(self):
        return {
            "timestamp": time.time(),
            "handeling": list(self.handelingJobs.values()),
            "queue": [
                {"job": job[0], "tag": job[1], "parallel": job[2]} for job in self.queue
            ],
        }


class proxyAccessor:
    def __init__(
        self, root, headers, coverPath, cachePath, gallaryPath, dbPath, downloadNotifyer
    ):
        self.root = root
        self.headers = headers
        self.cachedMap = LRUCache(maxsize=512, ttl=60, default=None)
        self.coverPath = coverPath
        self.cachePath = cachePath
        self.gallaryPath = gallaryPath
        self.db = sqlite3.connect(dbPath, check_same_thread=False)
        self.downloadNotifyer = downloadNotifyer
        self.JobSchedulerInstance = JobScheduler(
            handeler=self.handeler, maxParallel=5, onChange=self.onJobChange
        )
        self.currendDownloadProcess = [0, 0, -1]  # finished error total
        self.downloading = []  # 下载中的任务

    @atomWarpper
    def updateCurrentDownloadProcess(self, action, total=-1):
        if action == "reset":
            self.currendDownloadProcess = [0, 0, -1]
        elif action == "success":
            self.currendDownloadProcess[0] += 1
        elif action == "failed":
            self.currendDownloadProcess[1] += 1
        elif action == "set":
            self.currendDownloadProcess[2] = total

    def setCache(self, gid, token, key, value):
        self.cachedMap.add("{}_{}:{}".format(gid, token, key), value)

    def getCache(self, gid, token, key):
        return (
            self.cachedMap.get("{}_{}:{}".format(gid, token, key))
            if self.cachedMap.has("{}_{}:{}".format(gid, token, key))
            else None
        )

    def queryDownloaded(self):
        extendedQueryRes = []
        for x in self.db.execute(
            "SELECT g_data,over,total FROM downloaded ORDER BY addSerial DESC"
        ).fetchall():
            res = json.loads(x[0])
            res.update({"process": [x[1], x[2]]})
            extendedQueryRes.append(res)
        return extendedQueryRes

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
            return response.status_code == 200
        except Exception as e:
            logger.error(f"删除收藏 失败{e.__str__()}")
            return False

    @cache.memoize
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
            resp = urllib.request.urlopen(req, timeout=15)
            return resp.read().decode("utf-8")
        except urllib.error.URLError as e:
            raise makeTrackableExcption(e, f"获取HTML{url} 失败 ")

    #查询数据库 获取额外的下载信息
    def getDownloadExtend(self,gid,token):
        downloadedProcess = [0, 0]
        downloaded = None
        queryProcess = self.db.execute(
                "SELECT over,total FROM downloaded WHERE id_token =?",
                ("{}_{}".format(gid, token),),
            ).fetchone()
        if queryProcess == None:
            downloaded = False
        else:
            downloadedProcess = queryProcess
            downloaded = True
        return downloaded,downloadedProcess

    @printPerformance
    def g_data_from_pageHtml(self, gid, token):
        try:
            html = self.get_gallary_html_ignore_cache(gid, token)
        except Exception as e:
            raise makeTrackableExcption(e, f"从html获取g_data {gid}_{token} 失败 ")
        try:
            pageElem = BeautifulSoup(html, features="html.parser")
            urlSplit = pageElem.select_one("td.ptds > a").get("href").split("/")
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
                pageElem.select_one("#gdd > table > tr:nth-child(3) > td.gdt2 ").text
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
                tags.extend([rowname + x.text for x in row.select("td > div > a")])

            favo = pageElem.select_one("#favoritelink").text
            downloaded,downloadedProcess = self.getDownloadExtend(gid,token)

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
                    "favo": favo,
                    "downloaded": downloaded,
                    "process": downloadedProcess,
                },
            }
            self.setCache(gid, token, "g_data", g_data)
            self.setCache(
                gid, token, "cover", g_data["thumb"].replace("exhentai.org", "ehgt.org")
            )
            return g_data
        except Exception as e:
            # raise Exception(f"解析失败,{html}")
            raise makeTrackableExcption(e, f"创建g_data 解析失败,{html}")

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
                gid, token, "cover", g_data["thumb"].replace("exhentai.org", "ehgt.org")
            )#只有下载时 才会请求官方API 紧接着就会需要下载分娩
            return g_data
        except Exception as e:
            # raise Exception(f"{e.__str__()}\n官方API获取g_data {gid}_{token} 失败")
            raise makeTrackableExcption(e, f"官方API获取g_data {gid}_{token} 失败")

    def get_g_data(self, gid, token):
        if self.getCache(gid, token, "g_data") != None:
            logger.info(f"get g_data from cache {gid}_{token}")
            return self.getCache(gid, token, "g_data")
        queryres = self.db.execute(
            "select g_data from downloaded where id_token == ?",
            ("{}_{}".format(gid, token),),
        ).fetchone()
        if queryres is not None:
            query_g_data = json.loads(queryres[0])
            favo = False
            downloaded,downloadedProcess = self.getDownloadExtend(gid,token)
            query_g_data["extended"] = {
                "favo": favo,
                "downloaded": downloaded,
                "process": downloadedProcess,
            }
            self.setCache(gid, token, "g_data", query_g_data)
            logger.info(f"get g_data from db {gid}_{token}")
            return query_g_data
        try:
            g_data = self.g_data_from_pageHtml(gid, token)
            self.setCache(gid, token, "g_data", g_data)
            self.setCache(
                gid, token, "cover", g_data["thumb"].replace("exhentai.org", "ehgt.org")
            )
            logger.info(f"get g_data from pageHtml {gid}_{token}")
            return g_data
        except Exception as e:
            # raise Exception(f"{e.__str__()}\n获取g_data {gid}_{token} 失败 ")
            raise makeTrackableExcption(e, f"获取g_data {gid}_{token} 失败 ")

    def get_main_gallarys(self, url=""):
        html = None
        try:
            logger.info(f"爬取主页 url={url}")
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
            uploadtime = elem.select_one("div.gl5t > div > div:nth-child(2)").text
            downloaded = (
                self.db.execute(
                    "SELECT COUNT(*) FROM downloaded WHERE id_token =?",
                    ("{}_{}".format(gid, token),),
                ).fetchone()[0]
                == 1
            )
            favo = (
                elem.select_one("div.gl5t > div > div:nth-child(2)").get("style")
                != None
            )
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
                    "downloaded": downloaded,
                    "favo": favo,
                    "process": [0, 0],
                    "lang": lang,
                    "pages": pages,
                }
            )
        return infos

    @printPerformance
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
                logger.debug(f"封面 {filename} 从页面获取中...")
                try:
                    g_data = self.get_g_data(gid, token)
                    url = g_data["thumb"].replace("exhentai.org", "ehgt.org")
                except Exception as e:
                    logger.error(f"封面 {filename} 从页面获取失败")
                    raise makeTrackableExcption(e, f"封面 {filename} 下载失败")
            try:
                self.downloadImgFile(url, cachedCover)
                logger.debug(f"封面 {filename} 下载完成")
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
            raise makeTrackableExcption(e, f"预览图 {gid}_{token}:{index} 画廊页面获取失败")
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
                comment_text = comment_text.replace("https://exhentai.org/g/", "/#/g/")
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
                post_date = comment.select_one("div.c3").text.split(" by: ")[0][10:]
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
            os.path.join("{}_{}".format(gid, token), "{}.jpg".format(formatedindex)),
        )

        if os.path.exists(localPath):
            logger.debug(f"图片 {gid}_{token}:{index} 已下载")
            return localPath
        html = None
        logger.debug(f"获取图片 {gid}_{token}:{index}")
        try:
            html = self.get_gallary_html(gid, token, (index - 1) // 20)
        except Exception as e:
            raise makeTrackableExcption(e, f"获取图片 {gid}_{token}:{index} 画廊页面获取失败")

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
            raise makeTrackableExcption(e, f"获取图片 {gid}_{token}:{index} 图片页面获取失败")

        skipHathKey = re.findall(r"onclick=\"return nl\('([^\)]+)'\)", pageHtml)
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
            logger.debug(f"图片 {gid}_{token}:{index} 下载失败 ,  尝试跳过h@h  Url = {pageUrl}")
            try:
                pageHtml = self._getHtml(pageUrl)
                pageSoup = BeautifulSoup(pageHtml, features="html.parser")
                imgSrc = pageSoup.select_one("#img").get("src")
                self.downloadImgFile(imgSrc, cachePath)
            except Exception as e:
                raise makeTrackableExcption(e, f"获取图片 {gid}_{token}:{index} 跳过h@h失败")
        return cachePath

    def checkDownload(self, gid, token):
        coverPath = os.path.join(self.coverPath, "{}_{}.jpg".format(gid, token))
        if not checkImg(coverPath):
            os.remove(coverPath) if os.path.exists(coverPath) else None
            logger.error(f"封面 {gid}_{token} 检测不通过")
            return False
        downloadDir = os.path.join(self.gallaryPath, "{}_{}".format(gid, token))
        g_dataPath = os.path.join(downloadDir, "g_data.json")
        if not os.path.exists(g_dataPath):
            logger.error(f"g_data.json不存在 {gid}_{token}")
            return False
        g_data = json.load(open(g_dataPath))
        if str(g_data["gid"]) != str(gid) or str(g_data["token"]) != str(
            g_data["token"]
        ):
            os.remove(g_dataPath)
            logger.error(f"g_data.json不匹配 {gid}_{token}")
            return False
        flag = True
        for i in range(1, int(g_data["filecount"]) + 1):
            imgPath = os.path.join(downloadDir, "{0:08d}.jpg".format(i))
            if not checkImg(imgPath):
                os.remove(imgPath) if os.path.exists(imgPath) else None
                flag = False
                logger.error(f"图片 {gid}_{token}:{i} 检测不通过")
        return flag

    @atomWarpper
    @printPerformance
    def updateDownloadREC(self, gid, token, g_data=None, over=0):
        id_token = "{}_{}".format(gid, token)
        if g_data == None:
            self.db.execute(
                "UPDATE downloaded SET over = ? WHERE id_token = ?", (over, id_token)
            )
        else:
            recExists = (
                self.db.execute(
                    "SELECT count(*) FROM downloaded WHERE id_token = ?", (id_token,)
                ).fetchone()[0]
                == 1
            )
            if recExists:
                self.db.execute(
                    "UPDATE downloaded SET over = ? WHERE id_token = ?",
                    (over, id_token),
                )
            else:
                self.db.execute(
                    "INSERT INTO downloaded (id_token,over,total,g_data) VALUES (?,?,?,?)",
                    (id_token, over, int(g_data["filecount"]), json.dumps(g_data)),
                )
        self.db.commit()

    def onJobChange(self, action, info, result):
        if action == "running":
            pass
        elif action == "finished":  # job完成
            gid = result["gid"]
            token = result["token"]
            if result["type"] == "init":  # 下载初始化job完成
                self.updateCurrentDownloadProcess("set", result["result"])  # 更新当前下载进度
                self.reportDownloadProcess("queueChange")  # 报告当前下载进度
            elif result["type"] == "over":
                logger.debug(f"下载完成 {gid}_{token}")
                # 下载结束
                # 先报告进度，会用到成功失败计数器
                # 再更新数据库记录
                # 最后清空成功失败计数器
                self.reportDownloadProcess("over", gid, token)
                self.updateDownloadREC(gid, token, None, self.currendDownloadProcess[0])
                self.updateCurrentDownloadProcess("reset", None)
            elif result["type"] == "delete":
                logger.debug(f"已删除 {result['gid']}_{result['token']}")
                self.reportDownloadProcess("delete", gid, token)
            elif result["type"] == "download":
                self.updateCurrentDownloadProcess(result["result"], None)
                self.reportDownloadProcess("process", gid,token)
                # self.updateDownloadREC(gid, token, None, self.currendDownloadProcess[0])
                # 下载中 不再实时更新数据库进度
                # 仅在添加下载时 over = -1 下载中 over = 0 下载结束 over = downloadCount
            else:
                logger.warning(f"未知type {result['type']}")
        elif action == "add":
            pass
        elif action == "insert":
            pass
        elif action == "remove":
            pass
        else:
            logger.warning(f"未知action {action}")

    def handeler(self, job):
        try:
            return self.__handeler(job)
        except Exception as e:
            return {
                "type": "error",
                "index": -1,
                "result": e.__str__(),
                "job": job,
            }

    def __handeler(self, job):
        gid, token, g_data, arg = job
        downloadDir = os.path.join(self.gallaryPath, "{}_{}".format(gid, token))
        if arg == "init":
            logger.info(f"开始下载 {gid}_{token}")
            self.updateDownloadREC(gid, token, None, 0)
            os.makedirs(downloadDir, exist_ok=True)
            json.dump(
                g_data,
                open(os.path.join(downloadDir, "g_data.json"), "w"),
                ensure_ascii=True,
                indent=4,
            )
            coverDst = os.path.join(self.coverPath, "{}_{}.jpg".format(gid, token))
            try:
                coverSrc = self.get_cover(gid, token)
                shutil.move(coverSrc, coverDst)
                return {
                    "type": "init",
                    "gid": gid,
                    "token": token,
                    "index": -1,
                    "result": int(g_data["filecount"]),
                }
            except Exception as e:
                raise Exception(f"{e}\n下载{gid}_{token}时 封面下载失败")
        elif arg == "over":
            self.downloadingListHaneler(gid, token, "remove")
            return {
                "type": "over",
                "gid": gid,
                "token": token,
                "index": -1,
                "result": "downloadSuccess"
                if self.checkDownload(gid, token)
                else "downloadFailed",
            }
        elif arg == "delete":
            logger.info(f"删除 {gid}_{token}")
            self.db.execute(
                "DELETE FROM downloaded WHERE id_token = ?",
                ("{}_{}".format(gid, token),),
            )
            self.db.commit()
            coverPath = os.path.join(self.coverPath, "{}_{}.jpg".format(gid, token))
            os.remove(coverPath) if os.path.exists(coverPath) else None
            shutil.rmtree(downloadDir) if os.path.exists(downloadDir) else None
            return {
                "type": "delete",
                "gid": gid,
                "token": token,
                "index": -1,
                "result": "success",
            }
        else:
            index = arg
            src = None
            try:
                src = self.get_img(gid, token, index)
            except Exception as e:
                return {
                    "type": "download",
                    "gid": gid,
                    "token": token,
                    "index": index,
                    "result": "failed",
                }
            dst = os.path.join(downloadDir, "{0:08d}.jpg".format(index))
            shutil.move(src, dst)
            return {
                "type": "download",
                "gid": gid,
                "token": token,
                "index": index,
                "result": "success",
            }

    @atomWarpper
    def downloadingListHaneler(self, gid, token, action):
        if action == "add":
            self.downloading.append((gid, token))
        elif action == "remove":
            self.downloading.remove((gid, token))
        elif action == "include":
            return (gid, token) in self.downloading
        else:
            logger.error(f"未知action {action}")

    def download(self, gid, token):
        if self.downloadingListHaneler(gid, token, "include"):
            logger.warning(f"{gid}_{token} 已在下载列表中")
            return
        g_data = None
        try:
            g_data = self.g_data_official(gid, token)
        except Exception as e:
            logger.warning(f"下载画廊时 g_data无法获取 {gid}_{token}")
            self.JobSchedulerInstance.add_job(
                [gid, token, g_data, "over"], "{}_{}".format(gid, token)
            )  # 直接设置完成 然后经过检查 在通知前端
            return

        self.updateDownloadREC(gid, token, g_data, -1)

        # 添加正在下载标识 然后不响应同个画廊的下载请求
        self.downloadingListHaneler(gid, token, "add")

        self.JobSchedulerInstance.add_job(
            [gid, token, g_data, "init"], "{}_{}".format(gid, token)
        )

        self.JobSchedulerInstance.add_jobs(
            [
                [[gid, token, None, i], "{}_{}".format(gid, token), True]
                for i in range(1, int(g_data["filecount"]) + 1)
            ]
        )

        self.JobSchedulerInstance.add_job(
            [gid, token, g_data, "over"], "{}_{}".format(gid, token)
        )

    def deleteDownload(self, gid, token):
        self.JobSchedulerInstance.rm_job("{}_{}".format(gid, token))
        self.JobSchedulerInstance.insert_job(
            [gid, token, None, "delete"], "{}_{}".format(gid, token)
        )

    def listJobs(self):
        return self.JobSchedulerInstance.listJobs()

    def downloadMany(self, gid_token_list):
        for gid_token in gid_token_list:
            gid, token = gid_token.split("_")
            self.download(gid, token)

    def reDownloadAllFailed(self):
        needDownload = self.db.execute(
            "SELECT id_token FROM downloaded WHERE over != total"
        ).fetchall()
        gid_tokens = [gid_token for (gid_token,) in needDownload]
        threading.Thread(target=self.downloadMany, args=(gid_tokens,)).start()
        return gid_tokens

    def getDownloadProcess(
        self, action, gid=None, token=None
    ):
        if action == "queueChange":
            return (
                {
                    "type": "queueChange",
                    "data": self.downloading,  # 在提交下载的时候，self.downloading就已经更新，当下载初始化job完成时，才会报告
                }
            )
        elif action == "process":
            return (
                {
                    "type": "process",
                    "data": {
                        "gid": gid,
                        "token": token,
                        "process": self.currendDownloadProcess,
                    },
                }
            )
        elif action == "over":
            return (
                {
                    "type": "over",
                    "data": {
                        "gid": gid,
                        "token": token,
                        "process": self.currendDownloadProcess,
                    },
                }
            )
        elif action == "delete":
            return (
                {
                    "type": "delete",
                    "data": {
                        "gid": gid,
                        "token": token,
                    },
                }
            )
        return None

    def reportDownloadProcess(self, action, gid=None, token=None):  
        msg = self.getDownloadProcess(action, gid, token)
        self.downloadNotifyer(msg) if msg is not None else None

    def localSearch(self,query):
        logger.info(f"搜索 {query}")
        str = parse_qs(query)['f_search'][0]
        tagRe = '[A-Za-z0-9]+:"[^\$]+\$"'
        wordRe = '[\u0800-\u4e00\u4E00-\u9FA5A-Za-z0-9_]+'
        tags = []
        for tagRes in re.findall(tagRe, str):
            str = str.replace(tagRes, '')
            tags.append( re.sub('\$|"', '', tagRes))
        words = [json.dumps(x,ensure_ascii=True)[1:-1] for x  in  re.findall(wordRe, str)]
        sql = "SELECT g_data FROM downloaded WHERE 1 == 1 "
        for tag in tags:
            sql += f"AND g_data LIKE '%{tag}%' "
        for word in words:
            sql += f"AND g_data LIKE '%{word}%' "
        sql += "ORDER BY addSerial DESC"
        # print(sql)
        result = []
        for (g_data_json,) in self.db.execute(sql).fetchall():
            g_data = json.loads(g_data_json) 
            gid = g_data["gid"]
            token = g_data["token"]
            result.append(
                {
                    "gid": f"{gid}",
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "name": g_data["title_jpn"] if g_data["title_jpn"] != "" else g_data["title"],
                    "rank": float(g_data["rating"]) ,
                    "category": g_data["category"],
                    "uploadtime": timestamp_to_str("%Y-%m-%d %H:%M",  int(g_data["posted"])),
                    "downloaded": True,
                    "favo": False,
                    "process": [0, 0],
                    "lang": "chinese"  if "language:chinese" in g_data["tags"] else "",
                    "pages": g_data["filecount"],
                }
            )
        return result



ROOT_PATH = r"./"
CONFIG_PATH = os.path.join(ROOT_PATH, r"config.json")

if not os.path.exists(CONFIG_PATH):
    logger.error("配置文件不存在")
    exit(0)

CONFIG = json.load(open(CONFIG_PATH))

DOWNLOAD_PATH = os.environ.get("EH_DOWNLOAD_PATH", "")
if DOWNLOAD_PATH == "":
    DOWNLOAD_PATH = CONFIG["DOWNLOAD_PATH"]
    logger.info("using downloadpath from env")

if DOWNLOAD_PATH == "":
    logger.error("下载目录不存在")
    exit(0)

SERVER_FILE = os.path.join(ROOT_PATH, r"server")

DB_PATH = os.path.join(DOWNLOAD_PATH, os.path.join("api", "Data.db"))

CACHE_PATH = os.path.join(ROOT_PATH, r"cache")
# serverfile cache config 都是与server在同目录下
# download可以时其他也可以是本目录
# db同样放在下载目录下
GALLARY_PATH = os.path.join(DOWNLOAD_PATH, r"Gallarys")
COVER_PATH = os.path.join(DOWNLOAD_PATH, r"cover")

for pathName in [os.path.split(DB_PATH)[0], CACHE_PATH, GALLARY_PATH, COVER_PATH]:
    if not os.path.exists(pathName):
        os.makedirs(pathName)
        logger.info(f"创建了目录 {pathName}")

if not os.path.exists(DB_PATH):
    logger.info("数据库文件不存在,创建中...")
    with open(DB_PATH, "w") as f:
        f.write("")

    db = sqlite3.connect(DB_PATH)
    db.execute(
        "CREATE TABLE IF NOT EXISTS downloaded (id_token TEXT,over INTEGER,total INTEGER,g_data TEXT,addSerial INTEGER PRIMARY KEY ASC AUTOINCREMENT)"
    )
    db.commit()
    db.close()
    logger.info("创建数据库成功")


logger.info(f"ROOT_PATH {ROOT_PATH}")
logger.info(f"DOWNLOAD_PATH {DOWNLOAD_PATH}")
logger.info(f"SERVER_FILE {SERVER_FILE}")
logger.info(f"CACHE_PATH {CACHE_PATH}")
logger.info(f"DB_PATH {DB_PATH}")
logger.info(f"GALLARY_PATH {GALLARY_PATH}")
logger.info(f"COVER_PATH {COVER_PATH}")

cookie = CONFIG["cookie"]

if cookie == "":
    cookie = os.environ.get("EHCOOKIE", "")
    logger.info("using cookie from env")

if cookie == "":
    logger.error("cookie未设置")
    exit(1)
# 如果config存在，优先使用config提供的cookie
# 否则使用环境变量
# 如果都不存在，则报错
# logger.info(f"using cookie {cookie}")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
    "Cookie": cookie,
}


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)
        logger.info(f"WebSocket[{ws.client.host}:{ws.client.port}] 连接成功")
        msg = pa.getDownloadProcess("queueChange")
        await ws.send_json(msg) if msg is not None else None



    def disconnect(self, ws: WebSocket):
        logger.info(f"WebSocket[{ws.client.host}:{ws.client.port}] 断开链接")
        self.active_connections.remove(ws)

    async def broadcast(self, message):
        for connection in self.active_connections:
            await connection.send_json(message)


wsManager = ConnectionManager()


@atomWarpper
def nofityDownloadMessage(message):
    global wsManager
    async def sendMessage():
        # logger.info(f"发送消息 {message} 到 {len(wsManager.active_connections)} 个连接")
        await wsManager.broadcast(message)
    try:
        asyncio.run(sendMessage())
    except Exception as e:
        logger.error(f"发送消息失败 {e}")


pa = proxyAccessor(
    "https://exhentai.org/",
    headers,
    COVER_PATH,
    CACHE_PATH,
    GALLARY_PATH,
    DB_PATH,
    nofityDownloadMessage,
)

app = FastAPI(async_request_limit=1000)


ispublic = os.environ.get("PUBLIC_ENV") == "true"


@app.get("/addfavo/{gid_token}/{index}")
def addfavo(gid_token, index):
    if ispublic:
        return {"msg": "fail"}
    logger.info(f"添加收藏 {gid_token} {index}")
    gid, token = gid_token.split("_")
    if pa.addFavorite(gid, token, index):
        return {"msg": "success"}
    else:
        return {"msg": "fail"}


@app.get("/rmfavo/{gid_token}")
def rmfavo(gid_token):
    if ispublic:
        return {"msg": "fail"}
    logger.info(f"删除收藏 {gid_token}")
    gid, token = gid_token.split("_")
    if pa.rmFavorite(gid, token):
        return {"msg": "success"}
    else:
        return {"msg": "fail"}


@app.get("/download/{gid_token}")
def download(gid_token):
    logger.info(f"请求下载 {gid_token}")
    global downloadQueue
    gid, token = gid_token.split("_")
    pa.download(gid, token)
    return {"msg": "已提交下载"}


@app.get("/delete/{gid_token}")
def delete(gid_token):
    logger.info(f"请求删除 {gid_token}")
    gid, token = gid_token.split("_")
    pa.deleteDownload(gid, token)
    return {"msg": "已提交删除"}


@app.get("/redownloadall")
def redownloadall():
    return pa.reDownloadAllFailed()


@app.get("/gallarys/{gid_token}/{filename}")
def getfile(gid_token, filename, nocache=None):
    gid, token = gid_token.split("_")
    try:
        if filename == "g_data.json":
            if nocache == None:
                return pa.get_g_data(gid, token)
            else:
                try:
                    return pa.g_data_from_pageHtml(gid, token)  # nocache模式 优先去获取HTML
                except Exception as e:  # 获取失败则尝试其他方法 例如尝试访问一个被删除的画廊
                    return pa.get_g_data(gid, token)  # 其他方法页失败则raise
        else:
            index = int(filename.split(".")[0])
            filepath = pa.get_img(gid, token, index)
            return FileResponse(
                filepath,
                headers={
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "max-age=31536000",
                },
            )
    except Exception as e:
        trackE = makeTrackableExcption(e, f"请求文件 {gid_token} {filename} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=417, detail=str(trackE))


@app.get("/previews/{gid_token}/{filename}")
def getfile(gid_token, filename):
    gid, token = gid_token.split("_")
    index = int(filename.split(".")[0])
    try:
        bytes = pa.get_preview(gid, token, index)
        return Response(
            bytes,
            headers={"Content-Type": "image/jpeg", "Cache-Control": "max-age=31536000"},
        )
    except Exception as e:
        trackE = makeTrackableExcption(e, f"请求预览 {gid_token} {filename} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=404, detail=str(trackE))


@app.get("/comments/{gid_token}")
def comment(gid_token):
    gid, token = gid_token.split("_")
    try:
        comment = pa.get_comment(gid, token)
        return comment
    except Exception as e:
        trackE = makeTrackableExcption(e, f"请求评论 {gid_token} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=417, detail=str(trackE))


@app.get("/api/data")
def downloadedAll():
    downloadedG_data = pa.queryDownloaded()
    return downloadedG_data


@app.get("/list/{path}")
def gallaryList(path, request: Request):
    query = str(request.scope["query_string"], encoding="utf-8")
    url = path if query == "" else path + "?" + query
    try:
        result = pa.get_main_gallarys(url)
        return result
    except Exception as e:
        trackE = makeTrackableExcption(e, f"请求列表 {url} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=417, detail=str(trackE))


@app.get("/list/")
def gallaryListNoPath(request: Request):
    query = str(request.scope["query_string"], encoding="utf-8")
    url = "" if query == "" else "?" + query
    try:
        extendResult = []
        if "f_search" in query and "page=0" in query and "search_and_merge_local=true" in query:
            extendResult = pa.localSearch(query)
        result = extendResult + pa.get_main_gallarys(url) 
        return result
    except Exception as e:
        trackE = makeTrackableExcption(e, f"请求列表 {url} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=417, detail=str(trackE))


@app.get("/cover/{filename}")
def cover(filename):
    gid, token = filename.split(".")[0].split("_")
    try:
        filepath = pa.get_cover(gid, token)
        return FileResponse(
            filepath,
            headers={"Content-Type": "image/jpeg", "Cache-Control": "max-age=31536000"},
        )
    except Exception as e:
        trackE = makeTrackableExcption(e, f"请求封面 {filename} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=404, detail=str(trackE))


@app.get("/jobs")
def get_sheduled_jobs():
    return pa.listJobs()


@app.get("/")
def index():
    return FileResponse(os.path.join(SERVER_FILE, "index.html"))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await wsManager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        wsManager.disconnect(websocket)


app.mount("/", StaticFiles(directory=SERVER_FILE), name="static")


if __name__ == "__main__":
    uvicorn.run(
        app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), log_level="error"
    )
