import React, { useEffect, useRef, useState } from 'react';
import SwiperCore, { Controller, Keyboard, Mousewheel, Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/swiper.scss';
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
// import 'swiper/css/scrollbar';
import "swiper/swiper-bundle.min.css";

SwiperCore.use([Virtual, Controller, Keyboard, Mousewheel]);

//反向滑动
//对外部表现正常而无语考虑内部顺序
//从1开始
//需要value  setValue children
export default function TwoWaySwiper(props) {
    const out2in = () => {
        return props.reverse ? props.children.length - props.value : props.value - 1
    }
    const in2out = () => {
        return props.reverse ? props.children.length - privateValueRef.current : privateValueRef.current + 1
    }

    const privateValueRef = useRef(out2in());
    const handelSlideChange = (e) => {
        privateValueRef.current = e.activeIndex;
        props.setValue(in2out());
    }
    useEffect(() => {
        if (controllerRef.current === null) {
            return
        }

        if (props.value < 1) {
            props.setValue(1);
        }
        if (props.value > props.children.length) {
            props.setValue(props.children.length);
        }

        if (out2in() !== privateValueRef.current) {
            privateValueRef.current = out2in();
            controllerRef.current.slideTo(privateValueRef.current, 0)
        }
    }, [props.value]);
    const [controller, setController] = useState(null)
    const controllerRef = useRef(null)
    const setSwiperController = (swiperInstance) => {
        swiperInstance.slideTo(privateValueRef.current, 0)
        controllerRef.current = swiperInstance
        setController(swiperInstance)
    }
    useEffect(() => {
        if (controllerRef.current != null) {
            privateValueRef.current = out2in();
            controllerRef.current.slideTo(privateValueRef.current, 0)
        }

    }, [props.children])

    return (
        props.children.length === 0 ?
            null :
            <Swiper
                spaceBetween={5}
                slidesPerView={1}
                // speed={300}
                virtual
                onSlideChange={handelSlideChange}
                onSwiper={setSwiperController}
                controller={{ control: controller }}
            >
                {
                    (() => {
                        const tmp = []
                        if (props.reverse) {
                            for (let i = props.children.length - 1; i >= 0; i--) {
                                tmp.push(props.children[i])
                            }
                        } else {
                            for (let i = 0; i < props.children.length; i++) {
                                tmp.push(props.children[i])
                            }
                        }
                        return tmp
                    })().map((item, index) => {
                        return (
                            <SwiperSlide key={index} >
                                {item}
                            </SwiperSlide>)
                    })
                }
            </Swiper>
    )
}