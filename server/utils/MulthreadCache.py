import threading

from cacheout import LRUCache


class MulthreadCache(object):  # 等重写吧。。。
    def __init__(self):
        self.cache = LRUCache(maxsize=256, ttl=60, default=None)
        self.locks = {}

    def memoize(self, func):
        def newFunc(*arg, **kwargs):
            key = (func, arg)
            value = self.cache.get(key)
            if value != None:
                return value  # 已缓存 直接返回
            lock = self.locks.get(key)  # 没有缓存 尝试获取lock
            if lock == None:
                self.locks[key] = threading.Lock()
                lock = self.locks[key]  # 没有lock 则是第一次执行 创建lock
            lock.acquire()  # 等待其他线程执行完毕
            value = self.cache.get(key)
            if value != None:
                lock.release()
                return value  # 如果能获取到结果 则返回
            else:
                try:
                    value = func(*arg, **kwargs)
                    self.cache.set(key, value)
                    lock.release()
                    return value  # 执行原函数 获取结果 设置缓存 解锁 返回结果
                except Exception as e:
                    self.cache.set(key, None)
                    lock.release()  # 异常 设置缓存为None 解锁
                    raise e

        return newFunc


