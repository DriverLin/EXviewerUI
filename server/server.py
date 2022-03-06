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
from urllib.parse import urljoin, parse_qs

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
from utils.tools import timestamp_to_str, checkImg, atomWarpper, makeTrackableExcption, printTrackableException, logger, printPerformance
from utils.ProxyAccessor import ProxyAccessor

ssl._create_default_https_context = ssl._create_unverified_context

ROOT_PATH = r"./"

SERVER_FILE = os.path.join(ROOT_PATH, r"server")

CONFIG_PATH = os.path.join(ROOT_PATH, r"config.json")
if not os.path.exists(CONFIG_PATH):
    logger.error("配置文件不存在")
    exit(1)
CONFIG = json.load(open(CONFIG_PATH))

cookie = os.environ.get("EHCOOKIE", "")
if cookie == "":
    cookie = CONFIG["cookie"]
    logger.info("using cookie from config file")
else:
    logger.info("using cookie from env")
if cookie == "":
    logger.error("cookie未设置")
    exit(1)

DOWNLOAD_PATH = os.environ.get("EH_DOWNLOAD_PATH", "")
if DOWNLOAD_PATH == "":
    DOWNLOAD_PATH = CONFIG["DOWNLOAD_PATH"]
    logger.info("using downloadpath from config file")
else:
    logger.info("using downloadpath from env")
if DOWNLOAD_PATH == "":
    logger.error("下载目录不存在")
    exit(1)

GALLARY_PATH = os.path.join(DOWNLOAD_PATH, r"Gallarys")
COVER_PATH = os.path.join(DOWNLOAD_PATH, r"cover")
DB_PATH = os.path.join(DOWNLOAD_PATH, os.path.join("api", "Data.db"))

CACHE_PATH = os.environ.get("EH_CACHE_PATH")
if CACHE_PATH == "":
    CACHE_PATH = os.path.join(ROOT_PATH, r"cache")
    logger.info("using cache path from config file")
else:
    logger.info("using cache path from env")

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

        syncState = pa.getStauseForWS()
        await ws.send_json({
            "type":"state",
            "state":syncState
        }) if syncState is not None else None
        syncGalarys = pa.getDownloadedForWS()
        await ws.send_json(
            {
            "type":"gallary",
            "gallary":syncGalarys
        }) if syncGalarys is not None else None

     

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


pa = ProxyAccessor(
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
    # except WebSocketDisconnect:
    except Exception:
        wsManager.disconnect(websocket)


app.mount("/", StaticFiles(directory=SERVER_FILE), name="static")


if __name__ == "__main__":
    uvicorn.run(
        app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), log_level="error"
    )
