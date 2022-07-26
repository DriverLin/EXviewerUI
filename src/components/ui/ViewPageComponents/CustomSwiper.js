import { useRef, useState } from "react"

const fix8 = (num) => (Array(40).join(0) + num).slice(-8)
const dataList = Array.from({ length: 10 }).map((item, index) => ([{
    url: `http://localhost:7964/Gallery/2273412_d230a3b360/${fix8(index) + 1}.jpg`
}]))

const Render = () => {
    return <div
        style={{ backgroundColor: "#00d951", width: "100%", height: "100%" }}
    >
        
    </div>
}


const width = "100vw"

export default function CustomSwiper() {
    const [trx, setTrx] = useState(0)
    const [renderRange, setRenderRange] = useState([1, 5])
    
    const onDown = (e) => {
        console.log(e)
    }
    const onUp = (e) => {
        console.log(startX.current - lastX.current )  //负数向左滑动，正数向右滑动
        lastX.current = -1
        startX.current = -1
    }
    const lastX = useRef(-1)
    const startX = useRef(-1)
    const onMove = (e) => {
        const x = e.touches ? e.touches[0].clientX : e.clientX
        if (lastX.current === -1) {
            lastX.current = x
            return
        } else {
            const offset = x - lastX.current
            lastX.current = x
            setTrx(old => old + offset)
        }
    }

    return (
        <div
            style={{ overflowX: "hidden" , width:width }}
            onTouchStart={onDown}
            onTouchEnd={onUp}
            onTouchMove={onMove}
        >
            <div style={{ display: "flex", transform: `translateX(${trx}px)` }} >
                {
                    dataList.map((item, index) => <div key={index} style={{  width:width,   minHeight:"500px"   , border: "2px solid #d90051", flex: "0 0 auto" }}  >
                        {
                            (index <= renderRange[1] && index >= renderRange[0])
                            &&
                            item.map((args, innerIndex) => <Render {...args} />)
                        }
                    </div>)
                }
            </div>
        </div>
    )
}