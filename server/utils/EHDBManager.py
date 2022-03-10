import json
import queue
import sqlite3
import threading
from time import time


class EHDBManager:
    def __init__(self,DBPath) -> None:#数据库中间件 数据库的全映射 减少源文件的读写
        self.db = sqlite3.connect(DBPath,check_same_thread=False)
        self.taskQueue = queue.Queue()
        self.favo = {}
        self.download = {}
        self.g_data = {}
        for (gid,favonum) in self.db.execute("SELECT gid,favo FROM favo"):
            self.favo[gid] = favonum
        for (gid,token,over,addSerial) in self.db.execute("SELECT gid,token,over,addSerial FROM download"):
            self.download[gid] = {
                "gid":gid,
                "token":token,
                "over":over,
                "addSerial":addSerial
            }
        for (gid,g_data) in self.db.execute("SELECT gid,g_data FROM g_data"):
            self.g_data[gid] = json.loads(g_data)
        
        self.addSerialMax = self.db.execute("SELECT MAX(addSerial) FROM download").fetchone()[0]

        def excuteMany(args):
            start = time()
            for (SQL,param) in args:
                if param == None:
                    self.db.execute(SQL)
                else:
                    self.db.execute(SQL,param)
            # print(f"excuted {len(args)} in {time()-start}s")
            self.db.commit()

        def delayWrite():
            taskList = []
            while True:
                result = None
                try:
                    result = self.taskQueue.get(block=True,timeout=0.1)
                except Exception:
                    pass
                if result != None:
                    taskList.append(result)
                    if len(taskList) >= 16:
                        excuteMany(taskList)
                        taskList.clear()
                else:
                    if len(taskList) > 0:
                        excuteMany(taskList)
                        taskList.clear()
        threading.Thread(target=delayWrite).start()

    def putTask(self,SQL,param=None):
        self.taskQueue.put((SQL,param))

    def addFavo(self,_gid,favonum):
        gid = int(_gid)
        if self.getFavo(gid) == -1 :
            self.favo[gid] = favonum
            self.putTask("INSERT INTO favo (gid,favo) VALUES (?,?)",(gid,favonum))
        else:
            if self.getFavo(gid) != int(favonum):
                self.updateFavo(gid,favonum)
                self.favo[gid] = int(favonum)

    def updateFavo(self,_gid,favonum):
        gid = int(_gid)
        self.favo[gid] = favonum
        self.putTask(f"UPDATE favo SET favo = {favonum} WHERE gid = {gid}")

    def rmFavo(self,_gid):
        gid = int(_gid)
        if gid in self.favo:
            self.favo.pop(gid)
            self.putTask("DELETE FROM favo WHERE gid = ?",(gid,))
    
    def addDownload(self,_gid,token):
        gid = int(_gid)
        if self.getDownload(gid) != -2:
            self.updateDownload(gid,-1)
        else:
            addSerial = self.addSerialMax + 1
            self.download[gid] = {
                "gid":gid,
                "token":token,
                "over":-1,
                "addSerial":addSerial
            }
            self.putTask("INSERT INTO download (gid,token,over,addSerial) VALUES (?,?,?,?)",(gid,token,-1,addSerial))
            self.addSerialMax += 1

    def updateDownload(self,_gid,over):
        gid = int(_gid)
        self.download[gid]["over"] = over
        self.putTask("UPDATE download SET over = ? WHERE gid = ?",(over,gid))

    def rmDownload(self,_gid):
        gid = int(_gid)
        if gid in self.download:
            self.download.pop(gid)
            self.putTask("DELETE FROM download WHERE gid = ?",(gid,))

    def addGdata(self,_gid,g_data):
        gid = int(_gid)
        if self.getGdata(gid) != False:
            self.updateGdata(gid,g_data)
        else:
            self.g_data[gid] = g_data
            self.putTask("INSERT INTO g_data (gid,g_data) VALUES (?,?)",(gid,json.dumps(g_data)))
    
    def updateGdata(self,_gid,g_data):
        gid = int(_gid)
        self.g_data[gid] = g_data
        self.putTask("UPDATE g_data SET g_data = ? WHERE gid = ?",(json.dumps(g_data),gid))

    def rmGdata(self,_gid):
        gid = int(_gid)
        if gid in self.g_data:
            self.g_data.pop(gid)
            self.putTask("DELETE FROM g_data WHERE gid = ?",(gid,))
        
    def getFavo(self,_gid):
        gid = int(_gid)
        return self.favo[gid] if gid in self.favo else -1

    def getDownload(self,_gid):
        gid = int(_gid)
        return self.download[gid]["over"] if gid in self.download else -2
    
    def getGdata(self,_gid):
        gid = int(_gid)
        return self.g_data[gid] if gid in self.g_data else False

    def listDownload(self):
        downloaded = list(self.download.values())
        downloaded.sort(key=lambda x:x["addSerial"],reverse=True)
        return [x["gid"] for x in downloaded]

    def getState(self,__downloading_gid):
        downloading_gid = int(__downloading_gid)
        gids = set(self.download.keys()).union(set(self.favo.keys()))
        result = {}
        for gid in gids:
            result[gid] = [
                gid == downloading_gid,
                self.getFavo(gid),
                self.getDownload(gid)
            ]
        return result




    def execQuery(self,sql,param=None):
        return self.db.execute(sql,param).fetchall() if param != None else self.db.execute(sql).fetchall()


if __name__ == "__main__":
    dbm = EHDBManager(r"C:\Users\lty65\projects\ExviewerUI\server\DataForTest.db")
    start = time()
    gids = dbm.listDownload()
    for gid in gids[:5]:
        gd = dbm.getGdata(gid)
        dw = dbm.getDownload(gid)
        fa = dbm.getFavo(gid)
        print(dw,fa)
    
    print(f"test finish in {time()-start}s")
