import threading
import time

from utils.tools import atomWarpper, logger


class JobScheduler(object):
    def __init__(
        self, handler, maxParallel=5, onChange=lambda action, info, result: None
    ):
        # handler不允许报错
        #  出错直接用闭包的方式处理
        self.queue = []  # 任务队列 [并行? 标签 任务]
        self.queueSemaphore = threading.Semaphore(0)  # 队列信号量 等于长度 用于控制调度线程读取任务
        self.lock = threading.Lock()  # 锁 用于控制队列的读写
        self.handler = handler  # 执行器 外部传入
        self.MAXPARALLEL = maxParallel  # 最大并行数
        self.parallelJobs = threading.Semaphore(
            self.MAXPARALLEL)  # 并行任务信号量 用于控制并行任务数量
        self.jobsRunning = threading.Lock()  # 当前是否有任务正在运行   并行任务不可与串行任务同时运行
        self.handelingJobs = {}
        self.__onChange = onChange  # 当任务发生变化时调用 包括添加 删除 修改
        self.runLog = []  # 运行日志

        def schedule_thread():
            @atomWarpper
            def add_handelingJob(key, jobInfo):
                self.handelingJobs[key] = jobInfo
                self.onChange("running", jobInfo, None)

            @atomWarpper
            def finish_handelingJob(key, jobInfo, result):
                if key in self.handelingJobs:
                    del self.handelingJobs[key]
                    self.onChange("finished", jobInfo, result)


            while True:
                [job, tag, parallel] = self.get_job()
                if parallel:
                    self.runLog.append({
                        "job": job,
                        "type": "acquiring",
                        "time": time.time(),
                    })
                    self.parallelJobAcquire(1, f"[{job['action']}] => img_{job['index']}")
                    self.runLog.append({
                        "job": job,
                        "type": "acquired",
                        "time": time.time(),
                    })

                    def run_thread(_job, _tag, _parallel):
                        _jobInfo = {
                            "job": _job,
                            "tag": _tag,
                            "parallel": _parallel,
                            "timestamp": time.time(),
                        }
                        key = id(_job)
                        add_handelingJob(key, _jobInfo)

                        result = self.handler(_job)
                        finish_handelingJob(key, _jobInfo, result)
                        
                        self.parallelJobRelease(
                            1, f"[{_job['action']}] => img_{_job['index']}")
                        self.runLog.append({
                            "job": _job,
                            "type": "released",
                            "time": time.time(),
                        })

                    threading.Thread(target=run_thread, args=(
                        job, tag, parallel)).start()
                else:
                    self.runLog.append({
                        "job": job,
                        "type": "acquiring",
                        "time": time.time(),
                    })
                    self.parallelJobAcquire(self.MAXPARALLEL, f"finish")
                    self.runLog.append({
                        "job": job,
                        "type": "acquired",
                        "time": time.time(),
                    })
                    jobInfo = {
                        "job": job,
                        "tag": tag,
                        "parallel": parallel,
                        "timestamp": time.time(),
                    }
                    key = id(job)
                    add_handelingJob(key, jobInfo)
                    result = self.handler(job)
                    finish_handelingJob(key, jobInfo, result)
                    self.parallelJobRelease(self.MAXPARALLEL, f"finish")
                    self.runLog.append({
                        "job": job,
                        "type": "released",
                        "time": time.time(),
                    })

        threading.Thread(target=schedule_thread).start()

    def onChange(self,action,info,result):
        self.__onChange(action,info,result)
        # threading.Thread(target=self.__onChange,args=(action,info,result)).start()


    def parallelJobAcquire(self, count=1, msg=""):
        logger.debug(f"{msg} ({self.parallelJobs._value}) - {count}")
        [self.parallelJobs.acquire() for _ in range(count)]
        logger.debug(f"{msg} (x) - {count} = {self.parallelJobs._value}")

    def parallelJobRelease(self, count=1, msg=""):
        logger.debug(
            f"{msg} ({self.parallelJobs._value}) + {count}")
        [self.parallelJobs.release() for _ in range(count)]
        logger.debug(
            f"{msg} (x) + {count} = {self.parallelJobs._value}")

    def add_job(self, job, tag, parallel=False):
        self.lock.acquire()
        self.queue.append([job, tag, parallel])
        self.onChange("add", [[job, tag, parallel]], None)
        self.lock.release()
        self.queueSemaphore.release()

    def add_jobs(self, jobs):
        self.lock.acquire()
        for [job, tag, parallel] in jobs:
            self.queue.append([job, tag, parallel])
            self.queueSemaphore.release()
        self.onChange("add", jobs, None)
        self.lock.release()

    def insert_job(self, job, tag, parallel=False):
        self.lock.acquire()
        self.queue.insert(0, [job, tag, parallel])
        self.onChange("insert", [[job, tag, parallel]], None)
        self.lock.release()
        self.queueSemaphore.release()

    def get_job(self):
        self.queueSemaphore.acquire()
        self.lock.acquire()
        [job, tag, parallel] = self.queue.pop(0)
        self.lock.release()
        return [job, tag, parallel]

    def rm_job(self, tag):
        self.lock.acquire()
        original_len = len(self.queue)
        self.queue = [job for job in self.queue if job[1] != tag]
        [self.queueSemaphore.acquire()
         for _ in range(original_len - len(self.queue))]
        self.onChange("remove", tag, None)
        self.lock.release()


    def listLog(self):
        return self.runLog
