import json
from time import sleep
from tinydb import TinyDB
from tinydb.middlewares import CachingMiddleware
from tinydb.storages import JSONStorage

import requests
import os
#由于直接操作DB 所以应该在服务器关闭的时候使用
#或者直接集成到服务器里？


TREE_JSON = r"C:\Users\lty65\projects\ExviewerUI\server\tools\GalleryTree.json"
NOSQL_DB = r"D:\EHDownloads\api\NosqlDB.json"
API_URL = "http://localhost:7964/delete"
COOKIE = os.environ.get("EH_COOKIE", "")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
    "Cookie": COOKIE,
}

def getG_data(gidList):
    print(f"getG_data {gidList}")
    try:
        resp = requests.post(
            url="https://exhentai.org/api.php",
            json={
                "method": "gdata",
                "gidlist": gidList,
                "namespace": 1,
            },
            headers=headers,
        )
        print(resp.text)
        return json.loads(resp.text)['gmetadata']
    except Exception as e:
        print(e)
        return []


dataDB = TinyDB(NOSQL_DB, storage=CachingMiddleware(JSONStorage))
