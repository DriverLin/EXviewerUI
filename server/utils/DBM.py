import asyncio
import json
import os
import sqlite3
import threading
import time
from time import perf_counter
from typing import Dict, List

from fastapi import WebSocket
from tinydb import Query, TinyDB
from tinydb.middlewares import CachingMiddleware
from tinydb.queries import QueryLike
from tinydb.storages import JSONStorage
from tinydb.table import Document, Table

from utils.tools import logger

SET = 0
DEL = 1
SYNC = 2
LOAD = 3

#  * state: {
#  *   0: "未下载",
#  *   1: "队列中",
#  *   2: "下载中",
#  *   3: "已完成",
#  * }


class DOWNLOAD_STATE():
    NOT_DOWNLOADED: int = 0
    IN_QUEUE: int = 1
    NOW_DOWNLOADING: int = 2
    FINISHED: int = 3  # not success ,success is unknown


def printPerformance(func: callable) -> callable:
    def wrapper(*args, **kwargs):
        # start = time.time()
        start = time.perf_counter_ns()
        result = func(*args, **kwargs)
        logger.debug(
            f"{func.__name__}{args[1:]} 耗时 {(time.perf_counter_ns() - start) / 1000000} ms")
        return result
    return wrapper


class DBObject(dict):
    def __init__(self, key: int, obj: object, father) -> None:
        self.key = key
        self.data = obj if obj != None else {}
        self.father = father
        dict.__init__(self, obj)

    def __str__(self) -> str:
        return str(self.data)

    def __repr__(self) -> str:
        return self.__str__()

    def __getitem__(self, key):
        return self.data[key] if key in self.data else None

    def __setitem__(self, key, value):
        logger.debug(f"__setitem__ set {key} to {value}")
        self.data[key] = value
        self.father[self.key] = self.data

    def __len__(self) -> int:
        return len(self.data)

    def __iter__(self):
        return self.data.__iter__()


class EHDBM():
    def __init__(self, tab: Table, actionQueue: asyncio.Queue, actionHandeler: callable) -> None:
        self.db = tab
        self.cache = {
            rec["gid"]: rec
            for rec in self.db.all()
        }
        self.actionQueue = actionQueue
        self.version = 0
        self.versionLock = threading.Lock()
        self.actionHandeler = actionHandeler

    def handelAction(self, action):
        # self.actionQueue.put_nowait(action)
        self.actionHandeler(action)
        # print("handelAction no queue")

    def __str__(self) -> str:
        return str(self.db.all())

    def __repr__(self) -> str:
        return self.__str__()

    def keys(self) -> List[int]:
        return [k for k in self.cache]

    def __getitem__(self, key: int) -> object:
        return DBObject(key, self.cache[key], self) if key in self.cache else None

    # @printPerformance
    def __setitem__(self, key: int, value: object) -> None:
        logger.debug(f"__setitem__ set {key} to {value}")
        with self.versionLock:
            if 'gid' not in value:
                value['gid'] = key
            _next = (self.version + 1) & 0xffff
            self.handelAction(
                {
                    "action": SET,
                    "current": self.version,
                    "next": _next,
                    "key": key,
                    "value": value
                }
            )

            self.version = _next
            self.cache[key] = value
            self.db.upsert(value, Query().gid == key)

    def __delitem__(self, key: int) -> None:
        logger.debug(f"__delitem__ del {key}")
        with self.versionLock:
            _next = (self.version + 1) & 0xffff
            self.handelAction(
                {
                    "action": DEL,
                    "current": self.version,
                    "next": _next,
                    "key": key
                }
            )
            self.version = _next
            del self.cache[key]
            self.db.remove(Query().gid == key)

    def search(self, cond: QueryLike) -> List[Document]:
        return self.db.search(cond)

    def getDict(self) -> dict:
        return self.cache

    def sync(self, flag):
        self.handelAction(
            {
                "action": SYNC,
                "next": self.version,  # sync不更新version 因为sync是单客户端同步，而其他的则是广播
                "flag": flag,
                "data": {k: v for k, v in self.cache.items()}
            }
        )


class wsDBMBinder():
    def __init__(self, tab: Table, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop
        self._actionQueue = asyncio.Queue()
        self._dbm = EHDBM(tab=tab, actionQueue=self._actionQueue,
                          actionHandeler=self.handelAction)
        self._active_connections: List[WebSocket] = []

        async def asyncLoop():
            logger.debug("DBM action handler start")
            while True:
                action = await self._actionQueue.get()
                self.handelAction(action)
        self.loop.create_task(asyncLoop())

    def handelAction(self, action):
        try:
            if action["action"] == SET or action["action"] == DEL or action["action"] == LOAD:
                # logger.debug(json.dumps(action, indent=4, ensure_ascii=False))
                # await self._broadcast(action)
                self.loop.create_task(self._broadcast(action))
            elif action["action"] == SYNC:
                ws = action["flag"]
                action["flag"] = f"{ws.client.host}:{ws.client.port}"
                # logger.debug(json.dumps(action, indent=4, ensure_ascii=False))
                self.loop.create_task(ws.send_json(action))
        except Exception as e:
            logger.error(f"DBM action handler error: {e}")

    def getDBM(self):
        return self._dbm

    async def handel_connect(self, ws: WebSocket):
        await ws.accept()
        self._active_connections.append(ws)
        logger.info(f"{ws.client.host}:{ws.client.port} connected")
        try:
            while True:
                msg = await ws.receive_text()
                self._handel_message(msg, ws)
        except Exception as e:
            logger.info(f"{e} {ws} ws disconnect")
            self._active_connections.remove(ws)

    async def _broadcast(self, msg):
        for ws in self._active_connections:
            await ws.send_json(msg)

    def _handel_message(self, msg, ws):
        if msg == "sync":
            self._dbm.sync(ws)


def translateSQLite2Nosql():
    SQL_DB = sqlite3.connect(r"D:\EHDwonloads\api\Data.db")
    NOSQL_DB_path = r"D:\EHDwonloads\api\NosqlDB.json"
    os.remove(NOSQL_DB_path) if os.path.exists(NOSQL_DB_path) else None
    NOSQL_DB = TinyDB(NOSQL_DB_path, storage=CachingMiddleware(JSONStorage))
    g_data_tab = NOSQL_DB.table('g_data')
    download_tab = NOSQL_DB.table('download')
    favorite_tab = NOSQL_DB.table('favorite')
    card_info_tab = NOSQL_DB.table('card_info')

    start = perf_counter()

    g_data_all = [
        json.loads(g_data_text)
        for (gid, g_data_text) in SQL_DB.execute("SELECT * FROM g_data").fetchall()
    ]
    logger.info(f"g_data_all len: {len(g_data_all)}")

    download_all = [
        {'gid': gid, 'token': token, 'success': over,
            'state': DOWNLOAD_STATE.FINISHED,  'index': addSerial}
        for (gid, token, over, addSerial) in SQL_DB.execute("SELECT * FROM download")
    ]
    logger.info(f"download_all len: {len(download_all)}")

    favorite_all = [
        {'gid': gid, 'state': 2, 'index': favo}
        for (gid, favo) in SQL_DB.execute("SELECT * FROM favo")
    ]
    logger.info(f"favorite_all len: {len(favorite_all)}")

    card_info_all = [
        {
            'gid': x['gid'],
            'token':x['token'],
            'name':x['title_jpn'] or x['title'],
            'category':x['category'],
            'uploadTime':time.strftime("%Y-%m-%d %H:%M", time.localtime(int(x['posted']))),
            'lang':'chinese' if 'language:chinese' in x['tags'] else '',
            'rank':x['rating'],
            'pages':int(x['filecount'])
        }
        for x in g_data_all
    ]

    g_data_tab.insert_multiple(g_data_all)
    download_tab.insert_multiple(download_all)
    favorite_tab.insert_multiple(favorite_all)
    card_info_tab.insert_multiple(card_info_all)
    logger.info(f"create noSql DB in {perf_counter() - start}")
    NOSQL_DB.close()
    return [
        NOSQL_DB,
        g_data_tab,
        download_tab,
        favorite_tab,
        card_info_tab
    ]


# translateSQLite2Nosql() # 从sqlite创建nosql数据库 迁移后记得注释掉