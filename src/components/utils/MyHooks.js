import { useEffect, useRef, useState } from 'react';

const setStorage = (key, value) => {//不阻塞 但是数据会不同步
    setTimeout(() => {
        localStorage.setItem(key, value)
    }, 0)
}

const getStorage = (key, defaultValue) => {
    const localVal = localStorage.getItem(key)
    if (localVal === null) {
        setStorage(key, defaultValue)
        return defaultValue
    } else {
        return localVal
    }
}

export function useLocalStorage(key, defaultValue) {
    const [value, _setValue] = useState(getStorage(key, defaultValue))
    const setValue = (val) => {
        _setValue(val)
        setStorage(key, val)
        var useLocalStorageEvent = new Event("useLocalStorageEvent");
        useLocalStorageEvent.key = key;
        useLocalStorageEvent.newValue = val
        window.dispatchEvent(useLocalStorageEvent);
    }
    useEffect(() => {
        const handler = (e) => {
            if (e.key === key) {
                _setValue(e.newValue)
            }
        }
        window.addEventListener('useLocalStorageEvent', handler)//同页面只会触发useLocalStorageEvent
        window.addEventListener('storage', handler)//不同页面只会触发storage
        return () => {
            window.removeEventListener('useLocalStorageEvent', handler)
            window.removeEventListener('storage', handler)
        }
    })
    return [value, setValue]
}

export function useRefState(defaultValue) {
    const [value, _setValue] = useState(defaultValue)
    const ref = useRef(value)
    const setValue = (val) => {
        ref.current = val
        _setValue(val)
    }
    return [ref, value, setValue]
}

export function useVisualViewport() {
    const [viewport, setViewport] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handler = () => {
            if (!window.visualViewport) return
            setViewport({
                width: window.visualViewport.width,
                height: window.visualViewport.height,
            });
        };

        window.visualViewport.addEventListener("resize", handler);
        window.visualViewport.addEventListener("scroll", handler);

        return () => {
            window.visualViewport.removeEventListener("resize", handler);
            window.visualViewport.removeEventListener("scroll", handler);
        };
    }, []);

    return viewport;
}



















