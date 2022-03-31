
import json
import os
import shutil

from utils.EHDBManager import EHDBManager
from utils.JobScheduler import JobScheduler
from utils.tools import (atomWarpper, logger, makeTrackableExcption,
                         printPerformance, printTrackableException)

DOWNLOAD_START = 0
DOWNLOAD_IMG = 1
DOWNLOAD_FINISH = 2
DELETE_DOWNLOAD = 3

RESULT_INIT_FINISH = 0
RESULT_IMG_SUCCESS = 1
RESULT_IMG_FAILED = 2
RESULT_DOWNLOAD_FINISH = 3
RESULT_DELETE_FINISH = 4

FULL = 1


class DownloadManager:
    def __init__(self, dbm: EHDBManager, getG_data, getImg, getCover, report, gallaryPath, covePath):
        self.dbm = dbm
        self.getG_data = getG_data
        self.getImg = getImg
        self.getCover = getCover
        self.report = report
        self.gallaryPath = gallaryPath
        self.covePath = covePath
        self.downloading_gid = -1
        self.downloadingQueue = []
        self.downloadSuccess = 0
        self.JobSchedulerInstance = JobScheduler(handeler=self.handeler,
                                                 maxParallel=5, onChange=self.onJobChange)

    def handeler(self, job):
        gid = job["gid"]
        token = job["token"]
        action = job["action"]
        index = job["index"]
        if action == DOWNLOAD_START:
            self.downloading_gid = gid
            self.downloadSuccess = 0
            return RESULT_INIT_FINISH
        elif action == DOWNLOAD_IMG:
            try:
                src = self.getImg(gid, token, index)
                filename = "{0:08d}.jpg".format(int(index))
                dst = os.path.join(os.path.join(
                    self.gallaryPath, f"{gid}_{token}"), filename)
                shutil.move(src, dst)
                return RESULT_IMG_SUCCESS
            except Exception as e:
                printTrackableException(makeTrackableExcption(e,"下载处理器下载图片失败\n{}".format(json.dumps(job, ensure_ascii=False, indent=4))))
                return RESULT_IMG_FAILED
        elif job["action"] == DOWNLOAD_FINISH:
            self.downloading_gid = -1
            self.downloadSuccess = 0
            self.downloadingQueue = [
                x for x in self.downloadingQueue if x[0] != gid]
            return RESULT_DOWNLOAD_FINISH
        elif job["action"] == DELETE_DOWNLOAD:
            self.downloadingQueue = [
                x for x in self.downloadingQueue if x[0] != gid]
            coverPath = os.path.join(self.covePath, f"{gid}_{token}.jpg")
            saveDir = os.path.join(self.gallaryPath, f"{gid}_{token}")
            shutil.rmtree(saveDir) if os.path.exists(saveDir) else None
            os.remove(coverPath) if os.path.exists(coverPath) else None
            self.dbm.rmDownload(gid)
            self.dbm.rmGdata(gid)
            return RESULT_DELETE_FINISH
        return "OK"

    @atomWarpper
    def onSuccess(self):
        self.downloadSuccess += 1
        self.dbm.updateDownload(self.downloading_gid, self.downloadSuccess)

    def onJobChange(self, action, info, result):
        if action == "finished":  # job完成
            if result == RESULT_INIT_FINISH:
                self.report(FULL)
            elif result == RESULT_IMG_SUCCESS:
                self.onSuccess()
                self.report()
            elif result == RESULT_IMG_FAILED:
                self.report()
            elif result == RESULT_DOWNLOAD_FINISH:
                self.report()
            elif result == RESULT_DELETE_FINISH:
                self.report(FULL)
            else:
                pass

    def addDownload(self, __gid, token):
        logger.info(f"addDownload {__gid} {token}")
        gid = int(__gid)
        if (gid, token) in self.downloadingQueue:
            return  # 在队列中 则返回
        else:
            self.dbm.addDownload(gid, token)  # 立即添加下载记录
            g_data = None
            try:
                g_data = self.getG_data(gid, token)
                logger.info(
                    f"\n下载 {gid} {token}\n {json.dumps(g_data, ensure_ascii=False,indent=4)}")
            except Exception as e:
                raise makeTrackableExcption(e, "下载失败 无法获取g_data")
            try:
                src = self.getCover(gid, token)
                dst = os.path.join(self.covePath, f"{gid}_{token}.jpg")
                shutil.move(src, dst)
            except Exception as e:
                raise makeTrackableExcption(e, "下载失败 无法获取cover")
            self.dbm.addGdata(gid, g_data)  # 这里更新g_data
            savePath = os.path.join(self.gallaryPath, f"{gid}_{token}")
            os.makedirs(savePath, exist_ok=True)
            g_data_path = os.path.join(savePath, "g_data.json")
            json.dump(g_data, open(g_data_path, "w"),
                      ensure_ascii=True, indent=4)
            self.downloadingQueue.append((gid, token))
            self.JobSchedulerInstance.add_job({
                "gid": gid,
                "token": token,
                "action": DOWNLOAD_START,
                "index": -1
            }, gid, False)
            for i in range(int(g_data["filecount"])):
                self.JobSchedulerInstance.add_job({
                    "gid": gid,
                    "token": token,
                    "action": DOWNLOAD_IMG,
                    "index": i+1
                }, gid, True)
            self.JobSchedulerInstance.add_job({
                "gid": gid,
                "token": token,
                "action": DOWNLOAD_FINISH,
                "index": -1
            }, gid, False)

    def deleteDownloaded(self, __gid, token):
        gid = int(__gid)
        self.JobSchedulerInstance.rm_job(gid)
        self.JobSchedulerInstance.insert_job({
            "gid": gid,
            "token": token,
            "action": DELETE_DOWNLOAD,
            "index": -1
        }, gid, False)

    def listLog(self):
        return self.JobSchedulerInstance.listLog()
