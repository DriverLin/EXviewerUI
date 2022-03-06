import json
import logging
import os
import threading
import time

import coloredlogs

logger = logging.getLogger(f'{"main"}:{"loger"}')
fmt = f"%(asctime)s.%(msecs)03d .%(levelname)s \t%(message)s"
coloredlogs.install(
    level=logging.DEBUG, logger=logger, milliseconds=True, datefmt="%X", fmt=fmt
)

def checkImg(img):
    if img == None:
        return False
    lastBytes = b""
    if type(img) == str:
        if not os.path.exists(img):
            return False
        else:
            f = open(img, "rb")
            f.seek(-2, 2)
            lastBytes = f.read()
            f.close()
    elif type(img) == bytes:
        lastBytes = img[-2:]
    else:
        logger.warning("checkImg: unknow arg type", type(img))
    return lastBytes in [b"\xff\xd9", b"\x60\x82", b"\x00\x3b"]

def timestamp_to_str(formatstr, timestamp):
    return time.strftime(formatstr, time.localtime(timestamp))

def printTrackableException(e):
    try:
        for excTrack in json.loads(str(e)):
            logger.error(str(excTrack))
        logger.info("=" * 40)
    except Exception as e:
        logger.error(str(e))
        logger.info("=" * 40)


def makeTrackableExcption(e, appendE):
    try:
        exceptions = json.loads(str(e))
        exceptions.append(str(appendE))
        return Exception(json.dumps(exceptions))
    except Exception as jsonError:
        return Exception(json.dumps([str(e), str(appendE)]))


def printPerformance(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        logger.debug(f"{func.__name__}{args[1:]} 耗时 {end - start}")
        return result

    return wrapper


def atomWarpper(func):
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

