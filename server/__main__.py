import asyncio
import json
import os
import ssl
from os.path import join as path_join
import threading
from time import sleep, time

from fastapi import FastAPI, HTTPException, Request, Response, WebSocket
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from tinydb import TinyDB
from tinydb.middlewares import CachingMiddleware
from tinydb.storages import JSONStorage
from uvicorn import Config, Server

from utils.AioProxyAccessor import NOSQL_DBS, aoiAccessor
from utils.DBM import wsDBMBinder
from utils.tools import logger, makeTrackableException, printTrackableException

serverLoop = asyncio.new_event_loop()

ssl._create_default_https_context = ssl._create_unverified_context
ROOT_PATH = os.path.split(os.path.realpath(__file__))[0]
# SERVER_FILE = path_join(ROOT_PATH, r"static_file")
SERVER_FILE = path_join(os.path.abspath(path_join(ROOT_PATH, r"..")),"build")
CONFIG_PATH = path_join(ROOT_PATH, r"config.json")
if not os.path.exists(CONFIG_PATH):
    logger.error("配置文件不存在")
    exit(1)
CONFIG = json.load(open(CONFIG_PATH))

cookie = os.environ.get("EHCOOKIE", "")
if cookie == "":
    cookie = CONFIG["cookie"]
    logger.info("使用配置文件中的cookie")
else:
    logger.info("使用环境变量中的cookie")
if cookie == "":
    logger.error("cookie未设置")
    exit(1)

DOWNLOAD_PATH = os.environ.get("EH_DOWNLOAD_PATH", "")
if DOWNLOAD_PATH == "":
    DOWNLOAD_PATH = CONFIG["DOWNLOAD_PATH"]
    logger.info("使用配置文件指定的下载路径")
else:
    logger.info("使用环境变量指定的下载路径")
if DOWNLOAD_PATH == "":
    logger.error("下载目录不存在")
    exit(1)

GALLERY_PATH = path_join(DOWNLOAD_PATH, r"Gallarys")
COVER_PATH = path_join(DOWNLOAD_PATH, r"cover")
DB_PATH = path_join(DOWNLOAD_PATH, path_join("api", "NosqlDB.json"))

CACHE_PATH = os.environ.get("EH_CACHE_PATH", "")
if CACHE_PATH == "":
    CACHE_PATH = path_join(ROOT_PATH, r"cache")
    logger.info("使用默认缓存路径")
else:
    logger.info("使用环境变量指定的缓存路径")

for pathName in [os.path.split(DB_PATH)[0], CACHE_PATH, GALLERY_PATH, COVER_PATH]:
    if not os.path.exists(pathName):
        os.makedirs(pathName)
        logger.info(f"创建了目录 {pathName}")

if not os.path.exists(DB_PATH):
    logger.info("数据库文件不存在")


logger.info(f"根目录 {ROOT_PATH}")
logger.info(f"下载目录 {DOWNLOAD_PATH}")
logger.info(f"静态文件目录 {SERVER_FILE}")
logger.info(f"缓存目录 {CACHE_PATH}")
logger.info(f"数据库文件 {DB_PATH}")
logger.info(f"画廊下载目录 {GALLERY_PATH}")
logger.info(f"封面存放目录 {COVER_PATH}")


# 如果config存在，优先使用config提供的cookie
# 否则使用环境变量
# 如果都不存在，则报错
# logger.info(f"using cookie {cookie}")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
    "Cookie": cookie,
}


class CachingMiddlewareAutoWrite(CachingMiddleware):
    def __init__(self, storage_cls,ttw = 5):
        super().__init__(storage_cls)
        self.ttw = ttw
        self.lastWriteCount = 0
        self.running = True
        threading.Thread(target=self.writeWatcherThread).start()

    def __del__(self):
        self.running = False 

    def write(self, data):
        self.cache = data
        self._cache_modified_count += 1
        # # Check if we need to flush the cache
        # if self._cache_modified_count >= self.WRITE_CACHE_SIZE:
        #     self.flush()

    def writeWatcherThread(self):
        while self.running:
            if self._cache_modified_count != self.lastWriteCount:
                self.lastWriteCount = self._cache_modified_count
                self.flush()
                logger.debug(f"write cache to file")
            sleep(self.ttw)


NOSQL_DB = TinyDB(DB_PATH, storage=CachingMiddlewareAutoWrite(JSONStorage))
# NOSQL_DB = TinyDB(DB_PATH)
g_data_wsBinder = wsDBMBinder(NOSQL_DB.table('g_data'), serverLoop)
download_wsBinder = wsDBMBinder(NOSQL_DB.table('download'), serverLoop)
favorite_wsBinder = wsDBMBinder(NOSQL_DB.table('favorite'), serverLoop)
card_info_wsBinder = wsDBMBinder(NOSQL_DB.table('card_info'), serverLoop)

aioPa = aoiAccessor(
    headers=headers,
    coverPath=COVER_PATH,
    cachePath=CACHE_PATH,
    galleryPath=GALLERY_PATH,
    db=NOSQL_DBS(
        g_data_wsBinder.getDBM(),
        download_wsBinder.getDBM(),
        favorite_wsBinder.getDBM(),
        card_info_wsBinder.getDBM(),
    ),
    loop=serverLoop
)


# asyncio.get_event_loop().run_until_complete(wsBinderMainLoop())

app = FastAPI(async_request_limit=1000)
app.add_middleware(GZipMiddleware, minimum_size=1000)

isPublicENV = os.environ.get("PUBLIC_ENV", None) == "true"


@app.websocket("/g_data")
async def websocket_endpoint(websocket: WebSocket):
    await g_data_wsBinder.handel_connect(websocket)


@app.websocket("/download")
async def websocket_endpoint(websocket: WebSocket):
    await download_wsBinder.handel_connect(websocket)


@app.websocket("/favorite")
async def websocket_endpoint(websocket: WebSocket):
    await favorite_wsBinder.handel_connect(websocket)


@app.websocket("/card_info")
async def websocket_endpoint(websocket: WebSocket):
    await card_info_wsBinder.handel_connect(websocket)


@app.get("/addFavorite/{gid}/{token}/{index}")
async def addFavorite(gid: int, token: str, index: int):
    if isPublicENV:
        raise HTTPException(status_code=403, detail="PUBLIC_ENV,该API已禁用")
    logger.info(f"添加收藏 {gid}_{token} {index}")
    try:
        await aioPa.addFavorite(gid, token, index)
        return {"msg": f"{gid}_{token}已添加到收藏夹{index}"}
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"{gid}_{token} 添加收藏失败")))


@app.get("/rmFavorite/{gid}/{token}")
async def rmFavorite(gid: int, token: str):
    if isPublicENV:
        raise HTTPException(status_code=403, detail="PUBLIC_ENV,该API已禁用")
    logger.info(f"删除收藏 {gid}_{token}")
    try:
        await aioPa.rmFavorite(gid, token)
        return {"msg": f"{gid}_{token}已移除收藏"}
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"{gid}_{token} 移除收藏失败")))


@app.get("/download/{gid}/{token}")
async def download(gid: int, token: str):
    logger.info(f"添加下载 {gid}_{token}")
    try:
        await aioPa.addDownload([[gid, token]])
        return {"msg": f"{gid}_{token}已添加到下载队列"}
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"{gid}_{token} 添加下载失败")))


@app.get("/delete/{gid}/{token}")
async def delete(gid: int, token: str):
    logger.info(f"请求删除 {gid}_{token}")
    try:
        await aioPa.deleteDownload([[gid, token]])
        return {"msg": f"{gid}_{token}已删除"}
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"{gid}_{token} 删除失败")))


@app.get("/continueDownload")
async def continueDownload():
    reDownloadCount = await aioPa.continueDownload()
    return {"msg": f"已开始{reDownloadCount}项下载"}


@app.get("/Gallery/{gid_token}/{filename}")
async def getGalleryFile(gid_token: str, filename: str, nocache=None):
    gid, token = gid_token.split("_")
    gid = int(gid)
    try:
        if filename == "g_data.json":
            return await aioPa.get_G_data(gid, token, cached=(nocache == None))
        else:
            index = int(filename.split(".")[0])
            return FileResponse(
                await aioPa.getGalleryImage(gid, token, index),
                headers={
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "max-age=31536000",
                },
            )
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=404, detail=str(
            makeTrackableException(e, f"请求文件 {gid_token}/{filename} 失败")))


@app.get("/preview/{gid}/{token}/{index}")
async def getfile(gid: int, token: str, index: int):
    try:
        bytes = await aioPa.getGalleryPreview(gid, token, index)
        return Response(
            bytes,
            headers={"Content-Type": "image/jpeg",
                     "Cache-Control": "max-age=31536000"},
        )
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str( makeTrackableException(e, f"请求预览 {gid}/{token}/{index} 失败")))


@app.get("/comments/{gid}/{token}")
async def comment(gid: int, token: str):
    try:
        return await aioPa.getComments(gid, token)
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"请求评论 {gid}/{token} 失败")))


# @app.post("/post_comment")
# async def post_comment(request: Request):
#     body = await request.json()
#     gid = body["gid"]
#     token = body["token"]
#     comment = body["comment"]
#     if pa.post_comment(gid, token, comment):
#         return {"msg": "success"}
#     else:
#         return {"msg": "fail"}


@app.get("/list/{path}")
async def listMainGallery(path, request: Request):
    query = str(request.scope["query_string"], encoding="utf-8")
    url = path if query == "" else path + "?" + query
    try:
        return await aioPa.getMainPageGalleryCardInfo(f"https://exhentai.org/{url}")
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"请求列表 {url} 失败")))


@app.get("/list/")
async def listMainGalleryNoPath(request: Request):
    query = str(request.scope["query_string"], encoding="utf-8")
    url = "" if query == "" else "?" + query
    try:
        extendResult = []
        if "f_search" in query and "page=0" in query and "search_and_merge_local=true" in query:
            extendResult = aioPa.localSearch(query)
        result = []
        gidList = set() 
        for item in (extendResult + await aioPa.getMainPageGalleryCardInfo(f"https://exhentai.org/{url}")):
            if item["gid"] not in gidList:
                result.append(item)
                gidList.add(item["gid"])
        return result
    except Exception as e:
        trackE = makeTrackableException(e, f"请求列表 {url} 失败")
        printTrackableException(trackE)
        raise HTTPException(status_code=500, detail=str(trackE))


@app.get("/cover/{filename}")
async def asyncCover(filename: str):
    gid, token = filename.split(".")[0].split("_")
    gid = int(gid)
    try:
        return FileResponse(
            await aioPa.getGalleryCover(gid, token),
            headers={"Content-Type": "image/jpeg",
                     "Cache-Control": "max-age=31536000"},
        )
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=404, detail=str(
            makeTrackableException(e, f"请求封面 {filename} 失败")))


@app.get("/")
def index():
    return FileResponse(path_join(SERVER_FILE, "index.html"))


app.mount("/", StaticFiles(directory=SERVER_FILE), name="static")


if __name__ == "__main__":

    serverConfig = Config(
        app=app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 7964)),
        log_level="info",
        loop=serverLoop,
    )
    appServer = Server(serverConfig)
    serverLoop.run_until_complete(appServer.serve())
