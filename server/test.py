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
import urllib.error
import urllib.request
from turtle import down
from typing import List
from urllib.parse import parse_qs, urljoin

import coloredlogs
import requests
import uvicorn
from bs4 import BeautifulSoup
from cacheout import LRUCache
from fastapi import (FastAPI, HTTPException, Request, Response, WebSocket,
                     WebSocketDisconnect)
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from utils.ProxyAccessor import ProxyAccessor
from utils.tools import (atomWarpper, checkImg, logger, makeTrackableException,
                         printPerformance, printTrackableException,
                         timestamp_to_str)

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

    
    async def onMessage(self,msg,ws):
        logger.warning(f"收到消息{msg} from {ws.client.host}:{ws.client.port}")
        start = time.time()
        for result in pa.makeSyncData(msg):
            await ws.send_json(result)
        logger.warning(f"处理消息{msg} from {ws.client.host}:{ws.client.port} 耗时{time.time()-start}")
        
        

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

res = pa.localSearch('f_search=鮫肌%20parody%3A"granblue%20fantasy%24"')
print(res)
exit(0)
