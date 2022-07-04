import asyncio
import io
import json
import logging
import os
import threading
import time
from PIL import Image
import coloredlogs

printPerformance__log_path = r"p:\printPerformance.log"

logger = logging.getLogger(f'{"main"}:{"loger"}')
fmt = f"%(asctime)s.%(msecs)03d .%(levelname)s \t%(message)s"
coloredlogs.install(
    level=logging.DEBUG, logger=logger, milliseconds=True, datefmt="%X", fmt=fmt
)



def timestamp_to_str(formatstr, timestamp):
    return time.strftime(formatstr, time.localtime(timestamp))


def printTrackableException(e):
    try:
        for excTrack in json.loads(str(e)):
            logger.error(str(excTrack))
        logger.info("=" * 40)
    except Exception:
        logger.error(str(e))
        logger.info("=" * 40)


def makeTrackableException(e, appendE):
    try:
        exceptions = json.loads(str(e))
        exceptions.append(str(appendE))
        return Exception(json.dumps(exceptions))
    except Exception :
        return Exception(json.dumps([str(e), str(appendE)]))


printPerformance__log = {}
printPerformance__lock = threading.Lock()


def __printPerformance(func: callable) -> callable:
    def wrapper(*args, **kwargs):
        start = time.time()
        rec = {
            "func": func.__name__,
            "args": str(args),
            "kwargs": str(kwargs),
            "start": start,
            "end": -1
        }
        with printPerformance__lock:
            printPerformance__log[start] = rec
            with open(printPerformance__log_path, "w") as f:
                f.write(json.dumps(printPerformance__log,
                        indent=4, ensure_ascii=False))

        result = func(*args, **kwargs)
        end = time.time()
        rec = {
            "func": func.__name__,
            "args": str(args),
            "kwargs": str(kwargs),
            "start": start,
            "end": end
        }
        with printPerformance__lock:
            printPerformance__log[start] = rec
            with open(printPerformance__log_path, "w") as f:
                f.write(json.dumps(printPerformance__log,
                        indent=4, ensure_ascii=False))
        logger.debug(f"{func.__name__}{args[1:]} 耗时 {end - start}")
        return result

    return wrapper


def printPerformance(func: callable) -> callable:
    if asyncio.iscoroutinefunction(func):
        async def wrapper(*args, **kwargs):
            start = time.perf_counter_ns()
            result = await func(*args, **kwargs)
            logger.debug(
                f"{func.__name__}{args[1:]}{kwargs} 耗时 {(time.perf_counter_ns() - start) / 1000000} ms")
            return result
        return wrapper
    else:
        def wrapper(*args, **kwargs):
            start = time.perf_counter_ns()
            result = func(*args, **kwargs)
            logger.debug(
                f"{func.__name__}{args[1:]}{kwargs} 耗时 {(time.perf_counter_ns() - start) / 1000000} ms")
            return result
    return wrapper


def atomWarpper(func: callable) -> callable:
    lock = threading.Lock()
    def f(*args, **kwargs):
        lock.acquire()
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            raise e
        finally:
            lock.release()
        return result
    return f


def asyncWarper(func: callable) -> callable:
    async def wrapper(*args, **kwargs):
        print(f"{func.__name__} : {args} {kwargs}")
        return await asyncio.get_event_loop().run_in_executor(
            None, func, *args, **kwargs
        )
    return wrapper


async def asyncExecutor(func, *args, **kwargs):
    return await asyncio.get_event_loop().run_in_executor(
        None, func, *args, **kwargs
    )


# @printPerformance
# def checkImg(img):
#     if img == None:
#         return False
#     lastBytes = b""
#     if type(img) == str:
#         if not os.path.exists(img):
#             return False
#         else:
#             f = open(img, "rb")
#             f.seek(-2, 2)
#             lastBytes = f.read()
#             f.close()
#     elif type(img) == bytes:
#         lastBytes = img[-2:]
#     else:
#         logger.warning("checkImg: unknown arg type", type(img))
#     return lastBytes in [b"\xff\xd9", b"\x60\x82", b"\x00\x3b"]

def checkImg(img):
    if img == None:
        return False
    if type(img) == str:
        if not os.path.exists(img):
            return False
        else:
            try:
                Image.open(img).verify()
                return True
            except Exception as e:
                logger.warning(f"checkImg: verify failed: {e}")
    elif type(img) == bytes:
        try:
            Image.open(io.BytesIO(img)).verify()
            return True
        except Exception as e:
            logger.warning(f"checkImg:  verify failed: {e}")
    else:
        logger.warning("checkImg: unknown arg type", type(img))
        return False

def getUTCOffset():
    return time.strftime("%z")[:-2]