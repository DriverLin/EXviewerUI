import asyncio

from cacheout import LRUCache


class cacheItem():
    def __init__(self, lock, result, err, executing) -> None:
        self.lock = lock
        self.result = result
        self.err = err
        self.executing = executing

class AsyncCacheWarper():
    # 异步函数cache warper
    # 第一次执行过程中所有请求都会阻塞
    # 然后返回第一次执行的结果 或者抛出相同的异常
    # 第二次执行 如果第一次执行抛出异常 则再次尝试执行 否则直接返回第一次执行的结果
    # 函数会变成 result,err 的返回形式
    def __init__(
        self, loop: asyncio.AbstractEventLoop,
        cacheContainer=LRUCache(maxsize=512, default=None)
    ) -> None:
        self.cacheRWLock = asyncio.Lock(loop=loop)
        self.cache = cacheContainer

    async def executer(self, func, *arg, **kwargs):
        try:
            result = await func(*arg, **kwargs)
            return [result, None]
        except Exception as e:
            return [None, e]

    def setCache(self, key, lock, result, err, executing):
        self.cache.set(
            key,
            cacheItem(
                lock=lock,
                result=result,
                err=err,
                executing=executing
            )
        )

    def __call__(self, func):

        async def executeRE(*arg, **kwargs):
            key = (func, str(arg), str(kwargs))
            await self.cacheRWLock.acquire()
            if not self.cache.has(key):
                executeLock = asyncio.Lock()
                await executeLock.acquire()
                self.setCache(key, executeLock, None, None, True)
                first = True
            else:
                cacheItem = self.cache.get(key)
                first = False
            self.cacheRWLock.release()

            if not first:
                if cacheItem.executing:
                    await cacheItem.lock.acquire()
                    result, err = self.cache.get(
                        key).result, self.cache.get(key).err
                    cacheItem.lock.release()
                    return result, err
                else:
                    if cacheItem.err != None:
                        await self.cacheRWLock.acquire()
                        self.cache.delete(key)
                        self.cacheRWLock.release()
                        return await executeRE(*arg, **kwargs)
                    else:
                        return cacheItem.result, None
            else:
                result, err = await self.executer(func, *arg, **kwargs)
                self.setCache(key, executeLock, result, err, False)
                executeLock.release()
                return result, err
        return executeRE
