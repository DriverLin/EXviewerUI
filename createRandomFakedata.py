import json
import time
from faker import Faker
from tinydb import TinyDB
from tinydb.middlewares import CachingMiddleware
from tinydb.storages import JSONStorage
import random

NOSQL_DB = r"D:\EHDownloads\api\NosqlDB.json"

dataDB = TinyDB(NOSQL_DB, storage=CachingMiddleware(JSONStorage))
g_data_table = dataDB.table("g_data")
download_table = dataDB.table("download")


dataLength = 200
randomGallery = random.sample(g_data_table.all(), dataLength*2)
gidList = [x['gid'] for x in randomGallery[:dataLength]]
tokenList = [x['token'] for x in randomGallery[dataLength:]]
randomGallery = randomGallery[:dataLength]


faker = Faker()

fakeData = {
    "g_data": {},
    "fetchGalleryList": [],
    "comments": {},
}


fakeGalleryList = []
for index, g_data in enumerate(randomGallery):
    # erased = g_data.copy()
    # erased["gid"] = gidList[index]
    # erased["token"] = tokenList[index]
    # erased["torrentcount"] = "0"
    # erased["torrents"] = []
    tags = []
    for i in range(random.randint(5, 9)):
        type = faker.word()
        for j in range(random.randint(2, 6)):
            tags.append(f"{type}:{faker.word()}")

    fakeG_data = {
        "gid": gidList[index],
        "token": tokenList[index],
        "archiver_key": "",
        "title":   faker.paragraph(nb_sentences=1),
        "title_jpn": "",
        "category": faker.word(),
        "thumb": "",
        "uploader": faker.name(),
        "posted": g_data["posted"],
        "filecount": str(int(g_data["filecount"]) * 8),
        "filesize": g_data["filesize"] * 8,
        "expunged": g_data["expunged"],
        "rating": g_data["rating"],
        "torrentcount": "0",
        "torrents": [],
        "tags": tags,
    }
    fakeData["g_data"][gidList[index]] = fakeG_data
    fakeCardData = {
        "gid": fakeG_data["gid"],
        "token": fakeG_data["token"],
        "name": fakeG_data["title"],
        "rank": fakeG_data["rating"],
        "category": fakeG_data["category"],
        "uploadTime": time.strftime("%Y-%m-%d %H:%M", time.localtime(int(fakeG_data["posted"]))),
        "lang": "",
        "pages": int(fakeG_data["filecount"]),
    }
    fakeGalleryList.append(fakeCardData)
    comments = []
    for i in range(random.randint(3, 16)):
        lines = [faker.paragraph(nb_sentences=1) for _ in range(random.randint(1, 3))]
        text = "\n".join(lines)
        html = f'<div class=\"c6\" id=\"comment_0\">{"<br>".join(lines)}</div>'

        comments.append({
            "poster": faker.name(),
            "post_date": "11 July 2022, 14:31",
            "score": "+" + str(random.randint(1, 10)),
            "html": html,
            "text": text,
            "short": text,
            "isSelf": i == 1,
            "isUploader": False,
            "vote": 0,
            "commentID": i,
        })

    fakeData["comments"][gidList[index]] = {
        "data": comments,
        "all": True,
        "canVote": True,
    }

# 25一组分割
fakeData["fetchGalleryList"] = [fakeGalleryList[i:i+25]
                                for i in range(0, dataLength, 25)]


targetPath = r"C:\Users\lty65\projects\ExviewerUI\src\components\api\fakeData.json"
with open(targetPath, "w", encoding="utf-8") as f:
    f.write(json.dumps(fakeData, indent=4))
