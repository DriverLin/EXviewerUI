import { useState , useEffect } from 'react';

const setLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const getLocalStorage = (key, defaultValue) => {
    const lsval = localStorage.getItem(key)
    if (lsval === null) {
        setLocalStorage(key, defaultValue)
        return defaultValue
    }
    return JSON.parse(lsval)
}

export function useSetting(key, defaultValue) {
    const wapperedKey = `user_settings[${key}]`
    const initValue = getLocalStorage(wapperedKey, defaultValue)
    const [value, _setValue] = useState(initValue)
    const setValue = (val) => { 
        var useSettingEvent = new Event("useSettingEvent");
        useSettingEvent.key = wapperedKey;
        setLocalStorage(wapperedKey, val)
        window.dispatchEvent(useSettingEvent);
    }
    useEffect(() => {
        const handler = (e) => {
            if (e.key === wapperedKey) { 
                _setValue(getLocalStorage(wapperedKey, defaultValue))
            }
        }
        window.addEventListener('useSettingEvent', handler)//同页面只会触发useSettingEvent
        window.addEventListener('storage', handler)//不同页面只会触发storage
        return () => {
            window.removeEventListener('useSettingEvent', handler)
            window.removeEventListener('storage', handler)
        }
    })
    return [value, setValue]
}

export function useSettingBind(key, defaultValue) { 
    const [value, setValue] = useSetting(key, defaultValue)
    return value
}




















