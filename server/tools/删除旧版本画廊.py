import json
from time import sleep
from tinydb import TinyDB
from tinydb.middlewares import CachingMiddleware
from tinydb.storages import JSONStorage

import requests
import os


TREE_JSON = r"C:\Users\lty65\projects\ExviewerUI\server\tools\GalleryTree.json"
NOSQL_DB = r"D:\EHDownloads\api\NosqlDB.json"
API_URL = "http://localhost:7964/delete"
COOKIE = os.environ.get("EH_COOKIE", "")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
    "Cookie": COOKIE,
}


def readObj():
    return json.load(open(TREE_JSON))


def saveObj(obj):
    json.dump(obj, open(TREE_JSON, 'w'))


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
g_data_table = dataDB.table("g_data")
download_table = dataDB.table("download")


def get_father(g_data):
    if 'title' not in g_data:
        raise Exception("error g_data")
    return f"{g_data['parent_gid']}_{g_data['parent_key']}" if 'parent_gid' in g_data else "_"


g_data_map = {
    f"{rec['gid']}_{rec['token']}": rec
    for rec in g_data_table.all()
}

relationOBJ = readObj()
for rec in download_table.all():
    gid_token = f"{rec['gid']}_{rec['token']}"
    father = get_father(g_data_map[gid_token])
    relationOBJ[gid_token] = father

saveObj(relationOBJ)

gid_token_set = set()
for k in relationOBJ:
    gid_token_set.add(k)
    if relationOBJ[k] != "_":
        gid_token_set.add(relationOBJ[k])

while True:
    needUpdate = [
        gid_token for gid_token in gid_token_set if gid_token not in relationOBJ]
    splitted = [needUpdate[i: i + 25] for i in range(0, len(needUpdate), 25)]
    print("needUpdate", len(needUpdate))
    if len(needUpdate) == 0:
        break
    for gid_token_list in splitted:
        gidList = [x.split("_") for x in gid_token_list]
        try:
            g_data_list = getG_data(gidList)
            for g_data in g_data_list:
                son = f"{g_data['gid']}_{g_data['token']}"
                father = get_father(g_data)
                # print(g_data)
                relationOBJ[son] = father
                gid_token_set.add(son)
                if father != "_":
                    gid_token_set.add(father)
            saveObj(relationOBJ)
            print(gid_token_list)
        except Exception as e:
            print(e)
            continue

asFather = set([x for x in relationOBJ.values() if x != "_"])

for rec in download_table.all():
    gid_token = f"{rec['gid']}_{rec['token']}"
    if gid_token in asFather:
        print(gid_token, requests.get(
            f'{API_URL}/{rec["gid"]}/{rec["token"]}').text)
