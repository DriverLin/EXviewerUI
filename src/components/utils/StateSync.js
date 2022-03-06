import { useEffect } from "react"


export function useStateStorageChange(func){//貌似safari即使已经缓存的页面 在恢复时也可以收到积累的storage事件？
    useEffect( () => {
        const handler = (e) => {
            func(e.key,e.newValue)
        }
        window.addEventListener('StateStorageChangeEvent', handler)
        window.addEventListener('storage', handler)
        return () => {
            window.removeEventListener('StateStorageChangeEvent', handler)
            window.removeEventListener('storage', handler)
        }
    },[])
} 

export function dispathStateStorage(key,value){
    if(localStorage.getItem(key) === value) return
    setTimeout(()=>{
        localStorage.setItem(key,value)
    },0)
    var StateStorageChangeEvent = new Event("StateStorageChangeEvent");
    StateStorageChangeEvent.key = key;
    StateStorageChangeEvent.newValue = value
    window.dispatchEvent(StateStorageChangeEvent);
}
