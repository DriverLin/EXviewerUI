import threading
import time

from utils.tools import atomWarpper


class JobScheduler(object):
    def __init__(
        self, handeler, maxParallel=5, onChange=lambda action, info, result: None
    ):
        # handeler不允许报错
        #  出错直接用闭包的方式处理
        self.queue = []  # 任务队列 [并行? 标签 任务]
        self.queueSemaphore = threading.Semaphore(0)  # 队列信号量 等于长度 用于控制调度线程读取任务
        self.lock = threading.Lock()  # 锁 用于控制队列的读写
        self.handeler = handeler  # 执行器 外部传入
        self.MAXPARALLEL = maxParallel  # 最大并行数
        self.parallelJobs = threading.Semaphore(self.MAXPARALLEL)  # 并行任务信号量 用于控制并行任务数量
        self.jobsRunning = threading.Lock()  # 当前是否有任务正在运行   并行任务不可与串行任务同时运行
        self.handelingJobs = {}
        self.onChange = onChange  # 当任务发生变化时调用 包括添加 删除 修改

        def shdule_thread():
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
                    self.parallelJobs.acquire()

                    def run_thread():
                        jobInfo = {
                            "job": job,
                            "tag": tag,
                            "parallel": parallel,
                            "timestamp": time.time(),
                        }
                        key = id(job)
                        add_handelingJob(key, jobInfo)
                        result = self.handeler(job)
                        finish_handelingJob(key, jobInfo, result)
                        self.parallelJobs.release()

                    threading.Thread(target=run_thread).start()
                else:
                    [self.parallelJobs.acquire() for _ in range(self.MAXPARALLEL)]
                    jobInfo = {
                        "job": job,
                        "tag": tag,
                        "parallel": parallel,
                        "timestamp": time.time(),
                    }
                    key = id(job)
                    add_handelingJob(key, jobInfo)
                    result = self.handeler(job)
                    finish_handelingJob(key, jobInfo, result)
                    [self.parallelJobs.release() for _ in range(self.MAXPARALLEL)]

        threading.Thread(target=shdule_thread).start()

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
        [self.queueSemaphore.acquire() for _ in range(original_len - len(self.queue))]
        self.onChange("remove", tag, None)
        self.lock.release()

    def listJobs(self):
        return {
            "timestamp": time.time(),
            "handeling": list(self.handelingJobs.values()),
            "queue": [
                {"job": job[0], "tag": job[1], "parallel": job[2]} for job in self.queue
            ],
        }


