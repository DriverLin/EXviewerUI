import { useEffect, useRef } from "react"

export default function KeyboardController(props) {
    const getElems = () => {
        return Array.from(document.getElementsByName("clickable"))
    }

    const currentActive = useRef(null)

    // const getNext = (elems, index, direction) => {
    //     const posMap = {}
    //     const topS = Array.from(new Set(elems.map(e => e.offsetTop))).sort((a, b) => a - b)
    //     topS.forEach((top, i) => {
    //         posMap[top] = []
    //     })
    //     elems.forEach((elem, i) => {
    //         posMap[elem.offsetTop].push([i, elem.offsetLeft])
    //     })

    //     const currentLine = topS.indexOf(elems[index].offsetTop)
    //     const leftDis = elems[index].offsetLeft
    //     if (direction === "up") {
    //         if (currentLine === 0) return index
    //         let miniDistance = Number.MAX_SAFE_INTEGER
    //         let miniIndex = index
    //         posMap[currentLine - 1].forEach(([i, left]) => {
    //             const calDistance = Math.abs(left - leftDis)
    //             if (calDistance !== 0) {
    //                 if (calDistance < miniDistance) {
    //                     miniIndex = i
    //                     miniDistance = calDistance
    //                 }
    //             }
    //         })
    //         return miniIndex
    //     }
    //     else if (direction === "down") {
    //         if (currentLine === topS.length - 1) return index
    //         let miniDistance = Number.MAX_SAFE_INTEGER
    //         let miniIndex = index
    //         posMap[currentLine + 1].forEach(([i, left]) => {
    //             const calDistance = Math.abs(left - leftDis)
    //             if (calDistance !== 0) {
    //                 if (calDistance < miniDistance) {
    //                     miniIndex = i
    //                     miniDistance = calDistance
    //                 }
    //             }
    //         })
    //         return miniIndex
    //     }
    //     // else if (direction === "left") { 
    //     //     posMap[currentLine]
    //     // }


    // }

    const getNext = (elems, index, direction) => {
        if(index === -1) return 0
        
        const top = elems[index].offsetTop
        const left = elems[index].offsetLeft

        let resultIndex = index
        let miniTopDis = Number.MAX_SAFE_INTEGER
        let miniLeftDis = Number.MAX_SAFE_INTEGER

        elems.forEach((elem, i) => {
            if (direction === "ArrowUp") {
                const calTop = top-elem.offsetTop
                const calAbsLeft = Math.abs(elem.offsetLeft - left)
                if (calTop > 0) {
                    if (calTop < miniTopDis) { 
                        miniLeftDis = Number.MAX_SAFE_INTEGER
                    }
                    if (calTop <= miniTopDis && calAbsLeft < miniLeftDis) {
                        miniTopDis = calTop
                        miniLeftDis = calAbsLeft
                        resultIndex = i
                    }
                }
            } else if (direction === "ArrowDown") {
                const calTop = elem.offsetTop - top
                const calAbsLeft = Math.abs(elem.offsetLeft - left)
                if (calTop > 0) {
                    if (calTop < miniTopDis) { 
                        miniLeftDis = Number.MAX_SAFE_INTEGER
                    }
                    
                    if (calTop <= miniTopDis && calAbsLeft < miniLeftDis) {
                        miniTopDis = calTop
                        miniLeftDis = calAbsLeft
                        resultIndex = i
                    }
                }
            } else if (direction === "ArrowLeft") { 
                const calTop = elem.offsetTop - top
                const calLeft = left - elem.offsetLeft 
                if (calTop === 0 && calLeft > 0   ) {
                    if (calTop <= miniTopDis && calLeft < miniLeftDis) {
                        miniTopDis = calTop
                        miniLeftDis = calLeft
                        resultIndex = i
                    }
                }

            }else if (direction === "ArrowRight") {
                const calTop = elem.offsetTop - top
                const calLeft = elem.offsetLeft - left  
                if (calTop === 0 && calLeft > 0) {
                    if (calTop <= miniTopDis && calLeft < miniLeftDis) {
                        miniTopDis = calTop
                        miniLeftDis = calLeft
                        resultIndex = i
                    }
                }
            }
        })
        return resultIndex
    }


    const handleKeyDown = (e) => {
        
        if(  !["Enter","ArrowUp" , "ArrowDown" , "ArrowLeft","ArrowRight"].includes(e.key) ) return 
        e.preventDefault()
        if (e.key === "Enter") {
            try {
                currentActive.current.click()
            }
            catch (e) { }
            return
        }
        
        
        const currentElems = getElems()
        const currentIndex = currentElems.indexOf(currentActive.current)

        if (currentIndex === -1) {
            currentActive.current = currentElems[0]
            currentActive.current.classList.add("clickableDomOnSelected")
        } else {
            currentActive.current.classList.remove("clickableDomOnSelected")
            currentActive.current = currentElems[getNext(currentElems, currentIndex, e.key)]
            currentActive.current.classList.add("clickableDomOnSelected")
        }
    }


    useEffect(() => {
        // document.addEventListener("keydown", handleKeyDown);
        return () => {
            // document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);



    return null
}