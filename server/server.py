import asyncio
import json
import os
import queue
import re
import shutil
import sqlite3
import ssl
import threading
import time
import urllib.request
from typing import List
from urllib.parse import urljoin

import requests
import uvicorn
from bs4 import BeautifulSoup
from cacheout import LRUCache
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

ssl._create_default_https_context = ssl._create_unverified_context


def printPerformance(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print("---:",func.__name__, "耗时", end - start)
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


def checkImg(path):
    if path == None:
        return False
    if not os.path.exists(path):
        return False
    with open(path, "rb") as f:
        try:
            f.seek(-2, 2)
            img_text = f.read()
            f.close()
            for end in [b"\xff\xd9", b"\x60\x82", b"\x00\x3b"]:
                if img_text.endswith(end):
                    return True
        except Exception as e:
            print(e)
            return False
    return False


class multhread_cache(object):
    def __init__(self):
        self.cache = LRUCache(maxsize=256, ttl=60)

    def memoize(self, func):
        def new_func(*arg):
            if (
                (func, *arg) not in self.cache
                or self.cache.get((func, *arg)) is None
                or self.cache.get((func, *arg)) == "Error"
            ):
                con = threading.Condition()
                self.cache.set((func, *arg), [False, con])
                result = func(*arg)
                self.cache.set((func, *arg), [True, result])
                con.acquire()
                con.notifyAll()
                con.release()
                return result
            else:
                stause = self.cache.get((func, *arg))
                if stause[0] == True:
                    return stause[1]
                else:
                    stause[1].acquire()
                    print("cache waiting... " + func.__name__ + "(", *arg[1:], ")")
                    stause[1].wait()
                    stause[1].release()
                    return self.cache.get((func, *arg))[1]

        return new_func


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
        self.cachedMap = LRUCache(maxsize=512, ttl=60)
        self.coverPath = coverPath
        self.cachePath = cachePath
        self.gallaryPath = gallaryPath
        self.db = sqlite3.connect(dbPath, check_same_thread=False)
        self.downloadNotifyer = downloadNotifyer
        self.JobSchedulerInstance = JobScheduler(
            handeler=self.handeler, maxParallel=5, onChange=self.onJobChange
        )
        self.currendDownloadProcess = [0, 0, -1]  # finished error total

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

    def downloadFile(self, url, filePath):
        try:
            bytes = urllib.request.urlopen(url, timeout=15).read()
            with open(filePath, "wb") as f:
                f.write(bytes)
            return True
        except Exception as e:
            print(e)
            os.remove(filePath) if os.path.exists(filePath) else None
            return False

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
            print("添加收藏", e)
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
            print("删除收藏 error", e)
            return False

    @cache.memoize
    def _getHtml(self, url):
        return self._getHtml_ignore_cache(url)

    def _getHtml_ignore_cache(self, url):
        try:
            start = time.time()
            result = (
                urllib.request.urlopen(
                    urllib.request.Request(
                        url=urljoin(self.root, url),
                        headers=self.headers,
                    ),
                    timeout=15,
                )
                .read()
                .decode("utf-8")
            )
            print("get html", url, time.time() - start)
            return result
        except Exception as e:
            print(e)
            return "Error"  # 获取网页错误

    def g_data_from_pageHtml(self, gid, token):
        try:
            html = self.get_gallary_html_ignore_cache(gid, token)
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
            downloaded = (
                self.db.execute(
                    "SELECT COUNT(*) FROM downloaded WHERE id_token =?",
                    ("{}_{}".format(gid, token),),
                ).fetchone()[0]
                == 1
            )
            downloadedProcess = [0, 0]
            if downloaded:
                downloadedProcess = self.db.execute(
                    "SELECT over,total FROM downloaded WHERE id_token =?",
                    ("{}_{}".format(gid, token),),
                ).fetchone()

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
            print("从页面生成g_data错误", e)
            return None

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
            )
            return g_data
        except Exception as e:
            return None

    def get_g_data(self, gid, token):
        try:
            if self.getCache(gid, token, "g_data") != None:
                print("get g_data from cache", gid, token)
                return self.getCache(gid, token, "g_data")
            queryres = self.db.execute(
                "select g_data from downloaded where id_token == ?",
                ("{}_{}".format(gid, token),),
            ).fetchone()
            if queryres is not None:
                query_g_data = json.loads(queryres[0])
                self.setCache(gid, token, "g_data", query_g_data)
                print("get g_data from db", gid, token)
                return query_g_data
            g_data = self.g_data_from_pageHtml(gid, token)
            self.setCache(gid, token, "g_data", g_data)
            self.setCache(
                gid, token, "cover", g_data["thumb"].replace("exhentai.org", "ehgt.org")
            )
            return g_data
        except Exception as e:
            print("g_data error", e)
            return {}

    def get_main_gallarys(self, url=""):
        try:
            print("爬取主页画廊列表中,url=", url)
            start = time.time()
            html = BeautifulSoup(self._getHtml(url), features="html.parser")
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
                rankText = elem.select(
                    "div.gl5t > div:nth-child(2) > div:nth-child(1)"
                )[0].get("style")
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
            print("爬取主页画廊列表", url, "完成耗时", time.time() - start)
            return infos
        except Exception as e:
            print(e)
            return []

    def get_cover(self, gid, token):
        # 1.查询cover目录
        # 2.查询cover缓存
        # 3.直接查g_data 一定有
        # 返回文件地址
        filename = "{}_{}.jpg".format(gid, token)
        cachedCover = os.path.join(self.cachePath, filename)
        downloadCover = os.path.join(self.coverPath, filename) 
        if checkImg(downloadCover):
            print("封面", filename, "已下载")
            return downloadCover
        elif checkImg(cachedCover):
            print("封面", filename, "已缓存")
            return cachedCover
        else:
            start = time.time()
            url = self.getCache(gid, token, "cover")
            if url is None:
                print("封面", filename, "从页面获取中...")
                g_data = self.get_g_data(gid, token)
                if g_data is None:
                    return None
                url = g_data["thumb"].replace("exhentai.org", "ehgt.org")
            try:
                self.downloadFile(url, cachedCover)
                print("封面", filename, "下载完成,用时", time.time() - start)
                if checkImg(cachedCover):
                    return cachedCover
                return None
            except Exception as e:
                print(e)
                return None

    def get_gallary_html(self, gid, token, index=0):
        page_key = "P_{}".format(index)
        cached = self.getCache(gid, token, page_key)
        if cached != None and cached != "Error":
            return cached
        return self.get_gallary_html_ignore_cache(gid, token, index)

    def get_gallary_html_ignore_cache(self, gid, token, index=0):
        # 忽略cache 但是结果会放在cache中
        # 用于渲染画廊的时候
        page_key = "P_{}".format(index)
        url = "/g/{}/{}/?p={}".format(gid, token, index)
        result = self._getHtml_ignore_cache(url)
        self.setCache(gid, token, page_key, result)
        return result

    def get_preview(self, gid, token, index):
        print("获取预览图", gid, token, index)
        html = self.get_gallary_html(gid, token, (index - 1) // 20)
        soup = BeautifulSoup(html, features="html.parser")
        picUrl = (
            soup.select("div.gdtl > a > img")[(index - 1) % 20]
            .get("src")
            .replace("exhentai.org", "ehgt.org")
        )
        return urllib.request.urlopen(picUrl).read()

    def get_comment(self, gid, token):
        try:
            print("获取评论", gid, token)
            start = time.time()
            html = self.get_gallary_html(gid, token)
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
            print("获取评论完成", gid, token, "用时", time.time() - start)
            return result
        except Exception as e:
            print("获取评论失败", e)
            return []

    def get_img(self, gid, token, index):
        formatedindex = "{0:08d}".format(int(index))
        filename = "{}_{}_{}.jpg".format(gid, token, formatedindex)
        cachePath = os.path.join(self.cachePath, filename)
        if os.path.exists(cachePath):
            print("图片", gid, token, index, "已缓存")
            return cachePath
        # check local
        localPath = os.path.join(
            self.gallaryPath,
            os.path.join("{}_{}".format(gid, token), "{}.jpg".format(formatedindex)),
        )

        if os.path.exists(localPath):
            print("图片", gid, token, index, "已下载")
            return localPath
        start = time.time()
        print("图片", gid, token, index, "缓存中...")
        html = self.get_gallary_html(gid, token, (index - 1) // 20)
        soup = BeautifulSoup(html, features="html.parser")
        pageUrl = (
            soup.select("div.gdtl > a")[(index - 1) % 20]
            .get("href")
            .replace("https://exhentai.org/", "")
        )
        pageHtml = self._getHtml_ignore_cache(pageUrl)

        if pageHtml == "Error":
            return cachePath  # 返回不存在的路径 外部自动识别报错

        skipHathKey = re.findall(r"onclick=\"return nl\('([^\)]+)'\)", pageHtml)
        if len(skipHathKey) != 0:
            skipHathKey = skipHathKey[0]
        else:
            skipHathKey = ""

        pageSoup = BeautifulSoup(pageHtml, features="html.parser")
        imgSrc = pageSoup.select_one("#img").get("src")

        downloadResult = self.downloadFile(imgSrc, cachePath)

        if downloadResult == False:
            pageUrl = pageUrl + "?nl=" + skipHathKey
            print("图片", gid, token, index, "下载失败 ,  尝试跳过h@h  Url = ", pageUrl)
            pageHtml = self._getHtml(pageUrl)
            pageSoup = BeautifulSoup(pageHtml, features="html.parser")
            imgSrc = pageSoup.select_one("#img").get("src")
            if self.downloadFile(imgSrc, cachePath) == False:
                print("图片", gid, token, index, "无法下载!!!")
        print("图片", gid, token, index, "下载完成,用时", time.time() - start)
        return cachePath

    @atomWarpper
    def notifyDownloadProcess(self, obj):
        self.downloadNotifyer(obj)

    def checkDownload(self, gid, token):
        coverPath = os.path.join(self.coverPath, "{}_{}.jpg".format(gid, token))
        if not checkImg(coverPath):
            os.remove(coverPath) if os.path.exists(coverPath) else None
            print(
                "封面检测不通过",
                gid,
                token,
            )
            return False
        downloadDir = os.path.join(self.gallaryPath, "{}_{}".format(gid, token))
        g_dataPath = os.path.join(downloadDir, "g_data.json")
        if not os.path.exists(g_dataPath):
            print("g_data.json不存在", gid, token)
            return False
        g_data = json.load(open(g_dataPath))
        if str(g_data["gid"]) != str(gid) or str(g_data["token"]) != str(
            g_data["token"]
        ):
            os.remove(g_dataPath)
            print("g_data检测不通过", gid, token)
            return False
        flag = True
        for i in range(1, int(g_data["filecount"]) + 1):
            imgPath = os.path.join(downloadDir, "{0:08d}.jpg".format(i))
            if not checkImg(imgPath):
                os.remove(imgPath) if os.path.exists(imgPath) else None
                flag = False
                print("图片", gid, token, i, "检测不通过")
        return flag

    @atomWarpper
    def updateDownloadREC(self, gid, token, g_data=None, over=0):
        id_token = "{}_{}".format(gid, token)
        recExists = (
            self.db.execute(
                "SELECT count(*) FROM downloaded WHERE id_token = ?", (id_token,)
            ).fetchone()[0]
            == 1
        )
        if recExists:
            self.db.execute(
                "UPDATE downloaded SET over = ? WHERE id_token = ?", (over, id_token)
            )
        else:
            if g_data == None:
                g_data = self.g_data_official(gid, token)
            if g_data == None:
                print("g_data无法获取", gid, token)
                return
            self.db.execute(
                "INSERT INTO downloaded (id_token,over,total,g_data) VALUES (?,?,?,?)",
                (id_token, over, int(g_data["filecount"]), json.dumps(g_data)),
            )
        self.db.commit()

    def onJobChange(self, action, info, result):
        if action == "running":
            pass
        elif action == "finished":
            gid = result["gid"]
            token = result["token"]
            if result["type"] == "init":
                self.updateCurrentDownloadProcess("set", result["result"])
                self.notifyDownloadProcess(
                    {"gid": gid, "token": token, "tag": "notify", "msg": "开始下载"}
                )
            elif result["type"] == "over":
                print("下载完成", gid, token, result["result"])
                self.notifyDownloadProcess(
                    {
                        "gid": gid,
                        "token": token,
                        "tag": "notify",
                        "msg": result["result"],
                    }
                )
                self.updateDownloadREC(gid, token, None, self.currendDownloadProcess[0])
                self.updateCurrentDownloadProcess("reset")
            elif result["type"] == "delete":
                print("已删除", result["gid"], result["token"])
                self.notifyDownloadProcess(
                    {
                        "gid": gid,
                        "token": token,
                        "tag": "notify",
                        "msg": "deleteSuccess",
                    }
                )
            
            elif result["type"] == "download":
                self.updateCurrentDownloadProcess(result["result"])
                self.updateDownloadREC(gid, token, None, self.currendDownloadProcess[0])
                self.notifyDownloadProcess(
                    {
                        "gid": gid,
                        "token": token,
                        "tag": "reportProcess",
                        "msg": self.currendDownloadProcess,
                    }
                )
            else:
                print("未知type", result["type"])
        elif action == "add":
            pass
        elif action == "insert":
            pass
        elif action == "remove":
            pass
        else:
            print("未知action", action)

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
            print("开始下载", gid, token)
            self.updateDownloadREC(gid, token, g_data, 0)
            os.makedirs(downloadDir, exist_ok=True)
            json.dump(
                g_data,
                open(os.path.join(downloadDir, "g_data.json"), "w"),
                ensure_ascii=True,
                indent=4,
            )
            coverDst = os.path.join(self.coverPath, "{}_{}.jpg".format(gid, token))
            coverSrc = self.get_cover(gid, token)
            shutil.move(coverSrc, coverDst)
            return {
                "type": "init",
                "gid": gid,
                "token": token,
                "index": -1,
                "result": int(g_data["filecount"]),
            }

        elif arg == "over":
            return {
                "type": "over",
                "gid": gid,
                "token": token,
                "index": -1,
                "result": "downloadSuccess" if self.checkDownload(gid, token) else "downloadFailed",
            }
        elif arg == "delete":
            print("删除", gid, token)
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
            src = self.get_img(gid, token, index)
            if checkImg(src):
                dst = os.path.join(downloadDir, "{0:08d}.jpg".format(index))
                shutil.move(src, dst)
                return {
                    "type": "download",
                    "gid": gid,
                    "token": token,
                    "index": index,
                    "result": "success",
                }
            else:
                return {
                    "type": "download",
                    "gid": gid,
                    "token": token,
                    "index": index,
                    "result": "failed",
                }

    def download(self, gid, token):
        g_data = self.g_data_official(gid, token)
        if g_data == None:
            print("g_data无法获取", gid, token)
            self.JobSchedulerInstance.add_job(
                [gid, token, g_data, "over"], "{}_{}".format(gid, token)
            )  # 直接设置完成 然后经过检查 在通知前端
            return

        self.updateDownloadREC(gid, token, g_data, -1)
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


ROOT_PATH = r"./"
CONFIG_PATH = os.path.join(ROOT_PATH, r"config.json")

if not os.path.exists(CONFIG_PATH):
    print("配置文件不存在")
    exit(0)

CONFIG = json.load(open(CONFIG_PATH))

DOWNLOAD_PATH = CONFIG["DOWNLOAD_PATH"]

if DOWNLOAD_PATH == "":
    DOWNLOAD_PATH = os.environ.get("EH_DOWNLOAD_PATH", "")
    print("using downloadpath from env")

if DOWNLOAD_PATH == "":
    print("下载目录不存在")
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
        print("创建了目录", pathName)

if not os.path.exists(DB_PATH):
    print("数据库文件不存在,创建中...")
    with open(DB_PATH, "w") as f:
        f.write("")

    db = sqlite3.connect(DB_PATH)
    db.execute(
        "CREATE TABLE IF NOT EXISTS downloaded (id_token TEXT,over INTEGER,total INTEGER,g_data TEXT,addSerial INTEGER PRIMARY KEY ASC AUTOINCREMENT)"
    )
    db.commit()
    db.close()
    print("数据库文件创建完成")


print("ROOT_PATH", ROOT_PATH)
print("DOWNLOAD_PATH", DOWNLOAD_PATH)
print("SERVER_FILE", SERVER_FILE)
print("CACHE_PATH", CACHE_PATH)
print("DB_PATH", DB_PATH)
print("GALLARY_PATH", GALLARY_PATH)
print("COVER_PATH", COVER_PATH)

cookie = CONFIG["cookie"]

if cookie == "":
    cookie = os.environ.get("EHCOOKIE", "")
    print("using cookie from env")

if cookie == "":
    print("cookie未设置")
    exit(1)
# 如果config存在，优先使用config提供的cookie
# 否则使用环境变量
# 如果都不存在，则报错
print("using cookie", cookie)

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
        print(ws, "连接成功")

    def disconnect(self, ws: WebSocket):
        print(ws, "断开连接")
        self.active_connections.remove(ws)

    async def broadcast(self, message):
        for connection in self.active_connections:
            await connection.send_json(message)


wsManager = ConnectionManager()


def nofityDownloadMessage(message):
    global wsManager

    async def sendMessage():
        print("发送消息", message, "到", len(wsManager.active_connections), "个连接")
        await wsManager.broadcast(message)

    asyncio.run(sendMessage())


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
    print("添加收藏", gid_token, index)
    gid, token = gid_token.split("_")
    if pa.addFavorite(gid, token, index):
        return {"msg": "success"}
    else:
        return {"msg": "fail"}


@app.get("/rmfavo/{gid_token}")
def rmfavo(gid_token):
    if ispublic:
        return {"msg": "fail"}
    print("删除收藏", gid_token)
    gid, token = gid_token.split("_")
    if pa.rmFavorite(gid, token):
        return {"msg": "success"}
    else:
        return {"msg": "fail"}


@app.get("/download/{gid_token}")
def download(gid_token):
    global downloadQueue
    gid, token = gid_token.split("_")
    pa.download(gid, token)
    return {"msg": "已提交下载"}


@app.get("/delete/{gid_token}")
def delete(gid_token):
    gid, token = gid_token.split("_")
    pa.deleteDownload(gid, token)
    return {"msg": "已提交删除"}


@app.get("/gallarys/{gid_token}/{filename}")
def getfile(gid_token, filename, nocache=None):
    gid, token = gid_token.split("_")
    if filename == "g_data.json":
        if nocache == None:
            return pa.get_g_data(gid, token)
        else:
            return pa.g_data_from_pageHtml(gid, token)
    else:
        index = int(filename.split(".")[0])
        filepath = pa.get_img(gid, token, index)
        if checkImg(filepath):
            return FileResponse(
                filepath,
                headers={"Content-Type": "image/jpeg", "Cache-Control": "max-age=31536000"},
            )
        else:
            return None

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
        return None

@app.get("/comments/{gid_token}")
def comment(gid_token):
    gid, token = gid_token.split("_")
    comment = pa.get_comment(gid, token)
    return comment


@app.get("/api/data")
def downloadedAll():
    downloadedG_data = pa.queryDownloaded()
    return downloadedG_data


@app.get("/list/{path}")
def gallaryList(path, request: Request):
    query = str(request.scope["query_string"], encoding="utf-8")
    url = path if query == "" else path + "?" + query
    result = pa.get_main_gallarys(url)
    return result


@app.get("/list/")
def gallaryListNoPath(request: Request):
    query = str(request.scope["query_string"], encoding="utf-8")
    url = "" if query == "" else "?" + query
    result = pa.get_main_gallarys(url)
    return result


@app.get("/cover/{filename}")
def cover(filename):
    gid, token = filename.split(".")[0].split("_")
    filepath = pa.get_cover(gid, token)
    if filepath != None:
        return FileResponse(
            filepath,
            headers={"Content-Type": "image/jpeg", "Cache-Control": "max-age=31536000"},
        )
    else:# return error 
        return None

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
