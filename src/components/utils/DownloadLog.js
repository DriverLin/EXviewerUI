import * as echarts from 'echarts';
import React, { useEffect, useRef, useState } from 'react';


function renderItem(params, api) {
    var categoryIndex = api.value(0);
    var start = api.coord([api.value(1), categoryIndex]);
    var end = api.coord([api.value(2), categoryIndex]);
    var height = api.size([0, 1])[1] * 0.6;
    var rectShape = echarts.graphic.clipRectByRect(
        {
            x: start[0],
            y: start[1] - height / 2,
            width: end[0] - start[0],
            height: height
        },
        {
            x: params.coordSys.x,
            y: params.coordSys.y,
            width: params.coordSys.width,
            height: params.coordSys.height
        }
    );
    return (
        rectShape && {
            type: 'rect',
            transition: ['shape'],
            shape: rectShape,
            style: api.style()
        }
    );
}

const updateData = (myChart, server_time, data) => {
    if(myChart === null) return;
    let startTime = server_time
    const renderData = []
    const jobLifeCycle = {}
    for (let log of data) {
        startTime = Math.min(startTime, log.time)
        const key = JSON.stringify(log.job)
        if (jobLifeCycle[key] === undefined) {
            jobLifeCycle[key] = {}
        }
        if (log.type === "acquiring") {
            jobLifeCycle[key].acquiring = log.time
        } else if (log.type === "acquired") {
            jobLifeCycle[key].acquired = log.time
        } else if (log.type === "released") {
            jobLifeCycle[key].released = log.time
        }
    }

    const releasedTime = [0, 0, 0, 0, 0]
    for (let key of Object.keys(jobLifeCycle)) {
        const acquiring = jobLifeCycle[key].acquiring;
        const acquired = jobLifeCycle[key].hasOwnProperty("acquired") ? jobLifeCycle[key].acquired : data.server_time;
        const released = jobLifeCycle[key].hasOwnProperty("released") ? jobLifeCycle[key].released : data.server_time;

        const jobInfo = JSON.parse(key)
        let name = null
        let index = null
        if (jobInfo.action === 0) {
            name = `初始化 `
            index = 5
        } else if (jobInfo.action === 1) {
            name = `下载图片 ${jobInfo.index}`
            if (jobInfo.index <= 5) {
                index = jobInfo.index - 1
                releasedTime[index] = released
            } else {
                const miniIndex = releasedTime.indexOf(Math.min(...releasedTime))
                index = miniIndex
                releasedTime[miniIndex] = released
            }
        } else if (jobInfo.action === 2) {
            name = `完成 `
            index = 5
        } else if (jobInfo.action === 3) {
            name = `删除 `
            index = 5
        }
        renderData.unshift(
            {
                name: "等待" + name,
                value: [index, acquiring, acquired, acquired - acquiring],
                itemStyle: {
                    normal: {
                        color: "#4CAF50"
                    }
                }
            }
        )
        renderData.unshift(
            {
                name: name,
                value: [index, acquired, released, released - acquired],
                itemStyle: {
                    normal: {
                        color: "#FFC107"
                    }
                }
            }
        )
    }

    myChart.setOption({
        xAxis: {
            min: startTime,
            axisLabel: {
                formatter: function (val) {
                    return Math.max(0, val - startTime).toFixed(4) + ' s';
                }
            }
        },
        series: [
            {

                data: renderData
            }
        ]
    });
}


function SingleLogChart(props) {

   

    const myChart = useRef();

    useEffect(() => {
        const chartDom = document.getElementById(`chartdom_${props.name}`);
        myChart.current = echarts.init(chartDom, "default")
        myChart.current.setOption({
            tooltip: {
                formatter: function (params) {
                    try {
                        if (params.value === undefined) {
                            return ""
                        } else {
                            return params.marker + params.name + ': ' + params.value[3].toFixed(4) + ' s';
                        }
                    } catch (e) {
                        console.log(e, params)
                        return ""
                    }
                }
            },
            title: {
                text: `${props.name} 下载记录`,
                left: 'center'
            },
            dataZoom: [
                {
                    type: 'slider',
                    filterMode: 'weakFilter',
                    showDataShadow: false,
                    top: 400,
                    labelFormatter: ''
                },
                {
                    type: 'inside',
                    filterMode: 'weakFilter'
                }
            ],
            grid: {
                height: 300
            },
            xAxis: {
                scale: true,

            },
            yAxis: {
                data: ["1", "2", "3", "4", "5", "serial"]
            },
            series: [
                {
                    type: 'custom',
                    renderItem: renderItem,
                    itemStyle: {
                        opacity: 0.8
                    },
                    encode: {
                        x: [1, 2],
                        y: 0
                    },
                }
            ]
        });
        updateData(myChart.current, props.server_time, props.data)
    }, [])


    useEffect(() => {
        updateData(myChart.current, props.server_time, props.data)
        console.log("useEffect",props.data)
    }, [props.data.length])

    return <div
        id={`chartdom_${props.name}`}
        style={{
            width: "100%",
            height: "500px"
        }}
    ></div>
}


export default function DownloadLog(props) {
    const [chartDatas, setChartDatas] = useState({
        datas: []
    })



    const init = async () => {
        const rep = await fetch('/logs',{
            headers: {
                'Accept-Encoding': 'gzip',
            }
        })
        const data = await rep.json()
        const splitedData = []
        const chartNames = []
        const addToChartNames = (_name, _index) => {
            const index = _index ? _index : 1
            const name = `${_name}_${index}`
            if (chartNames.includes(name)) {
                addToChartNames(_name, index + 1)
            } else {
                chartNames.unshift(name)
            }
        }
        const tmp = []
        for (let log of data.logs) {
            if (log.type === "acquiring" && log.job.action === 0) {//下载的申请 视为图表的开始 倒下赐个结束
                if (tmp.length !== 0) {
                    splitedData.unshift([...tmp])
                    addToChartNames(tmp[0].job.gid)
                    tmp.length = 0
                }
                tmp.push(log)
            } else {
                tmp.push(log)
            }
        }
        if (tmp.length !== 0) {
            splitedData.unshift([...tmp])
            addToChartNames(tmp[0].job.gid)
        }
        setChartDatas(
            {
                datas: splitedData,
                names: chartNames,
                server_time: data.server_time
            }
        )
    }

    useEffect(() => {
        init();
        setInterval(init, 1000);
        return () => {
            clearInterval(init);
        }
    }, []);


    return (
        <div>
            {
                chartDatas.datas.map((data, index) => {
                    return <SingleLogChart
                        key={chartDatas.names[index]}
                        server_time={chartDatas.server_time}
                        data={data}
                        name={chartDatas.names[index]} />
                })
            }
        </div>
    )
}