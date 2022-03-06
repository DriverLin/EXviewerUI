import { useEffect, useRef } from "react";
import {notifyMessage} from "../utils/PopoverNotifier";
export default function OnlineManinPage(props) {
    const [gallaryList, setGalaryList] = useState([])
    const [loadingBar, setLoadingBar] = useState(true)
    const pageIndex = useRef(props.offset || 0)
    const lock = useRef(false)
    
    
    const mergeGallary = (arr1,arr2) => {
        const result = []
        const set = new Set()
        for(let arr of [arr1,arr2]){
            for(let item of arr){
                if(!set.has(item.gid)){
                    set.add(item.gid)
                    result.push(item)
                }
            }
        }
    }
    
    
    const requestNextPage = async () => {
        if (lock.current) return
        lock.current = true
        console.log("apiurl", props.apiUrl)
        //apiurl 类似  /watched?0=0 
        //或者 /?f_search=abcd&0=0
        //因为拼接页数 所以无论如何都有?
        const response = await fetch(props.apiUrl + `&page=${pageIndex.current}`)
        if (response.ok) {
            pageIndex.current += 1
            const data = await response.json()
            setGalaryList(prev =>   mergeGallary(prev,data)   )
        } else {
            lock.current = false;
            setLoadingBar(false)
            const text = await response.text()
            try {
                const info = JSON.parse(text)
                notifyMessage("error", JSON.parse(info.detail))
            } catch (error) {
                notifyMessage("error", text)
            }
        }

    }


    const lastE = useRef(0);
    const handelScroll = (e) => {
        const dis2trigger = 3
        if (e.target !== document) {
            return
        }
        const end = e.target.documentElement.scrollHeight - e.target.documentElement.scrollTop - e.target.documentElement.clientHeight
        if (lastE.current > dis2trigger && end <= dis2trigger) {
            console.log("触底触发加载")
            requestNextPage()
        }
        lastE.current = end
    }

    useEffect(() => {
        window.addEventListener('scroll', handelScroll, true)
        return () => { window.removeEventListener('scroll', handelScroll, true) }
    }, [])

    useEffect(() => {
        fetchData()
    }, [])


    return <div>{
        }</div>


}