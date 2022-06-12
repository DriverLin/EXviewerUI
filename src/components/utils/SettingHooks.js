import { useMemo } from 'react';
import { useLocalStorage } from './MyHooks';

export function useSetting(key, defaultValue) {
    const warperKey = `user_settings[${key}]`
    const [value,setValue] =  useLocalStorage(warperKey,  JSON.stringify(defaultValue)  )
    const jsonValue = useMemo( () => JSON.parse(value),[value])
    const setJsonValue = (newValue) => {
        setValue(JSON.stringify(newValue))
    }
    return [jsonValue,setJsonValue]
}

export function useSettingBind(key, defaultValue) { 
    return useSetting(key, defaultValue)[0]
}
export function getSetting(key, defaultValue) {
    const warperKey = `user_settings[${key}]`
    const local = localStorage.getItem(warperKey)
    if(local){
        return JSON.parse(local)
    }else{
        return defaultValue
    }
}




















