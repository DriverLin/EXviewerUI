import React, { useState, useEffect, useRef } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Virtual, Controller, Keyboard, Mousewheel } from 'swiper';
// import 'swiper/swiper.scss';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

SwiperCore.use([Virtual, Controller, Keyboard, Mousewheel]);

//反向滑动
//对外部表现正常而无语考虑内部顺序
//从1开始
//需要value  setValue children
export default function TwoWaySwiper(props) {
    const out2in = () => {
        return props.reverse ? props.children.length - props.value : props.value -1
     }
    const in2out = () => {
        return props.reverse ? props.children.length - priveteValueRef.current : priveteValueRef.current + 1
    }

    const priveteValueRef = useRef(out2in());
    const handelSlideChange = (e) => {
        priveteValueRef.current = e.activeIndex;
        props.setValue(in2out());
    }
    useEffect(() => {
        if (controllerRef.current === null) {
            return
        }
        
        if (props.value < 1) { 
            props.setValue(1);
        }
        if (props.value > props.children.length ) {
            props.setValue(props.children.length );
        }
        
        if (out2in() !== priveteValueRef.current) {
            priveteValueRef.current = out2in();
            controllerRef.current.slideTo(priveteValueRef.current, 0)
        }
    }, [props.value]);
    const [controller, setController] = useState(null)
    const controllerRef = useRef(null)
    const setSwiperControler = (swiperInstance) => {
        swiperInstance.slideTo(priveteValueRef.current,0)
        controllerRef.current = swiperInstance
        setController(swiperInstance)
    }
    
    useEffect(() => {
        if (controllerRef.current != null) { 
            priveteValueRef.current = out2in();
            controllerRef.current.slideTo(priveteValueRef.current, 0)
        }
        
    }, [props.children])

    return (
        props.children.length === 0 ?
            null :
            <Swiper spaceBetween={5}
                slidesPerView={1}
                virtual
                onSlideChange={handelSlideChange}
                onSwiper={setSwiperControler}
                controller={{ control: controller }}
                keyboard={{ invert: true, }}
            >
                {
                    (() => {
                        const tmp = []
                        if (props.reverse) {
                            for (let i = props.children.length - 1; i >= 0; i--) {
                                tmp.push(props.children[i])
                            }
                        } else {
                            for (let i = 0; i< props.children.length; i++) {
                                tmp.push(props.children[i])
                            }
                        }
                        return tmp
                    })().map((item, index) => {
                        return (
                            <SwiperSlide key={index} virtualIndex={index}>
                                {item}
                            </SwiperSlide>)
                    })
                }
            </Swiper>
    )
}

