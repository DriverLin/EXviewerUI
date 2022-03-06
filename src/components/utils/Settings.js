import { useState , useEffect, useMemo } from 'react';
import { useLocalStorage } from './MyHooks';

export function useSetting(key, defaultValue) {
    const wapperedKey = `user_settings[${key}]`
    const [value,setValue] =  useLocalStorage(wapperedKey,  JSON.stringify(defaultValue)  )
    const jsvalue = useMemo( () => JSON.parse(value),[value])
    const setjsvalue = (newValue) => {
        setValue(JSON.stringify(newValue))
    }
    return [jsvalue,setjsvalue]
}

export function useSettingBind(key, defaultValue) { 
    return useSetting(key, defaultValue)[0]
}




















