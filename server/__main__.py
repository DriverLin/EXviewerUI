import asyncio
import json
import os
import ssl
from os.path import join as path_join
import threading

from fastapi import FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
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

serverLoop = asyncio.get_event_loop()

ssl._create_default_https_context = ssl._create_unverified_context

ROOT_PATH = os.path.split(os.path.realpath(__file__))[0]
SERVER_FILE = path_join(os.path.abspath(path_join(ROOT_PATH, r"..")), "build")
CONFIG_PATH = path_join(ROOT_PATH, r"config.json")
if not os.path.exists(CONFIG_PATH):
    open(CONFIG_PATH, "w").write(json.dumps({
        "EH_DOWNLOAD_PATH": "",
        "EH_CACHE_PATH": "",
        "EH_COOKIE": "",
        "PORT": 7964
    }, indent=4))
CONFIG = json.load(open(CONFIG_PATH))


def getConfig(key, default=None):  # 先检查环境变量 然后检查配置文件 如果default不空则返回default 否则报错
    if os.environ.get(key) != None:
        logger.info(f"config[{key}] from env", )
        return os.environ.get(key)
    if key in CONFIG and CONFIG[key] != "":
        logger.info(f"config[{key}] from config.json", )
        return CONFIG[key]
    if default != None:
        logger.info(f"config[{key}] using default : {default}")
        return default
    logger.error(f"config [{key}] not found !")
    exit(1)


COOKIE = getConfig("EH_COOKIE", None)
DOWNLOAD_PATH = getConfig(
    "EH_DOWNLOAD_PATH", path_join(ROOT_PATH, r"download"))
CACHE_PATH = getConfig("EH_CACHE_PATH", path_join(ROOT_PATH, r"cache"))

GALLERY_PATH = path_join(DOWNLOAD_PATH, r"Gallery")
COVER_PATH = path_join(DOWNLOAD_PATH, r"cover")
DB_PATH = path_join(DOWNLOAD_PATH, path_join("api", "NosqlDB.json"))

for pathName in [os.path.split(DB_PATH)[0], CACHE_PATH, GALLERY_PATH, COVER_PATH]:
    if not os.path.exists(pathName):
        os.makedirs(pathName)
        logger.info(f"创建了目录 {pathName}")

logger.info(f"画廊下载目录 {GALLERY_PATH}")
logger.info(f"封面下载目录 {COVER_PATH}")
logger.info(f"数据库文件 {DB_PATH}")
logger.info(f"缓存目录 {CACHE_PATH}")

FAVORITE_DISABLED = getConfig("EH_FAVORITE_DISABLED", 'false')
DOWNLOAD_DISABLED = getConfig("EH_DOWNLOAD_DISABLED", 'false')
EH_POST_COMMENT_DISABLED = getConfig("EH_POST_COMMENT_DISABLED", 'false')
PORT = int(getConfig("PORT", 7964))

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
    "Cookie": COOKIE,
}


class CachingMiddlewareAutoWrite(CachingMiddleware):
    def __init__(self, storage_cls, ttw=30):
        super().__init__(storage_cls)
        self.ttw = ttw
        self.lastWriteCount = 0
        self.running = True
        self.writeLock = threading.Lock()
        self.stopSignal = threading.Event()

    def write(self, data):
        with self.writeLock:
            self.cache = data
            self._cache_modified_count += 1

    def writeWatcherThread(self):
        logger.info("CachingMiddlewareAutoWrite write thread start")
        while not self.stopSignal.wait(self.ttw):
            if self._cache_modified_count != self.lastWriteCount:
                with self.writeLock:
                    self.lastWriteCount = self._cache_modified_count
                    self.flush()
                logger.debug(f"write cache to file")
        if self._cache_modified_count != self.lastWriteCount:
            with self.writeLock:
                self.lastWriteCount = self._cache_modified_count
                self.flush()
                logger.debug(f"write cache to file")
        logger.info(f"CachingMiddlewareAutoWrite write thread stopped")

    def stop(self):
        self.stopSignal.set()


NOSQL_CACHE = CachingMiddlewareAutoWrite(JSONStorage)
NOSQL_DB = TinyDB(DB_PATH, storage=NOSQL_CACHE)
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



app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)


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
    if FAVORITE_DISABLED == "true":
        raise HTTPException(
            status_code=403, detail="FAVORITE_DISABLED,该API已禁用")
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
    if FAVORITE_DISABLED == "true":
        raise HTTPException(
            status_code=403, detail="FAVORITE_DISABLED,该API已禁用")
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
    if DOWNLOAD_DISABLED == "true":
        raise HTTPException(
            status_code=403, detail="DOWNLOAD_DISABLED,该API已禁用")
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
    if DOWNLOAD_DISABLED == "true":
        raise HTTPException(
            status_code=403, detail="DOWNLOAD_DISABLED,该API已禁用")
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
    if DOWNLOAD_DISABLED == "true":
        raise HTTPException(
            status_code=403, detail="DOWNLOAD_DISABLED,该API已禁用")
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
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"请求预览 {gid}/{token}/{index} 失败")))


@app.get("/comments/{gid}/{token}")
async def comment(gid: int, token: str):
    try:
        return await aioPa.getComments(gid, token, False)
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"请求评论 {gid}/{token} 失败")))

@app.get("/comments/all/{gid}/{token}")
async def comment(gid: int, token: str):
    try:
        return await aioPa.getComments(gid, token, True)
    except Exception as e:
        printTrackableException(e)
        raise HTTPException(status_code=500, detail=str(
            makeTrackableException(e, f"请求评论 {gid}/{token} 失败")))

# @app.post("/post_comment")
# async def post_comment(request: Request):
#     if EH_POST_COMMENT_DISABLED == "true": return
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


@app.get("/getDiskCacheSize")
def getDiskCacheSize():
    text = aioPa.getDiskCacheSize()
    return {"msg": text}


@app.get("/clearDiskCache")
def clearDiskCache():
    text = aioPa.clearDiskCache()
    return {"msg": text}

@app.get("/reUpdateLocalG_data/{count}")
async def reUpdateLocalG_data(count: int):
    serverLoop.create_task(aioPa.reUpdateLocalG_data(count))
    return {"msg": "success"}

@app.get("/")
def index():
    return FileResponse(path_join(SERVER_FILE, "index.html"))


@app.websocket("/uploadZip")
async def handelUploadZipGallery(ws: WebSocket):
    try:
        await ws.accept()
        gid,token = (await ws.receive_text()).split("_")
        logger.info(f"从浏览器接收画廊中 {gid}_{token}.zip")
        bytes = await ws.receive_bytes()
        logger.info(f"接收bytes{len(bytes)}")
        await aioPa.addDownloadRecordFromZip(int(gid),token,bytes)
    except WebSocketDisconnect as e:
        print("ws 断开",e)
        pass

app.mount("/", StaticFiles(directory=SERVER_FILE), name="static")


if __name__ == "__main__":

    serverConfig = Config(
        app=app,
        host="0.0.0.0",
        port=PORT,
        log_level="info",
        loop=serverLoop,
        ws_max_size= 1024*1024*1024*1024
    )
    appServer = Server(serverConfig)
    DB_CACHE_WRITER = threading.Thread(target=NOSQL_CACHE.writeWatcherThread)
    DB_CACHE_WRITER.start()
    serverLoop.run_until_complete(appServer.serve())
    NOSQL_CACHE.stop()
    DB_CACHE_WRITER.join()


