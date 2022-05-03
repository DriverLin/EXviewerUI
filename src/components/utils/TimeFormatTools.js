export default class timeTools {
    static timestamp_to_str(time, format) {
        //时间戳转日期
        //精确到秒
        const date = new Date(Number(time + "000"))
        var o = {
            "M+": date.getMonth() + 1, // 月份
            "d+": date.getDate(), // 日
            "h+": date.getHours(), // 小时
            "m+": date.getMinutes(), // 分
            "s+": date.getSeconds(), // 秒
            "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
            "S": date.getMilliseconds() // 毫秒
        };
        if (/(y+)/.test(format))
            format = format.replace(RegExp.$1, (date.getFullYear() + ""));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return format;
    }
    static gallery_time_str_to_timestamp(time_str) {
        //画廊日期转时间戳 精确到秒
        const reg = /(\d{4})-(\d{2})-(\d{2}) :(\d{2}):(\d{2})/
        const [, year, month, day, hour, minute] = time_str.match(reg)
        return Math.floor((new Date(year, month - 1, day, hour, minute).getTime() + 8 * 60 * 60 * 1000) / 1000)
    }
    static comment_time_str_to_timestamp(time_str) {
        //评论日期转时间戳 精确到秒
        const month_2_num = [
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
        let format = time_str
        month_2_num.forEach((month, index) => {
            format = format.replace(month, index + 1)
        })
        const reg = /(\d+) (\d+) (\d+), (\d+):(\d+)/
        const [, day, month, year, hour, minute] = reg.exec(format)
        //8小时时差
        const greenwich_time = new Date(year, month - 1, day, hour, minute).getTime() + 8 * 60 * 60 * 1000
        return Math.floor(greenwich_time / 1000)
    }
    static comment_time_reformat(time_str) {
        //转换时区并格式化评论日期
        const timestamp = timeTools.comment_time_str_to_timestamp(time_str)
        if (new Date().getTime() - timestamp * 1000 < 24 * 60 * 60 * 1000) {
            if(new Date().getTime() - timestamp * 1000 <  60 * 60 * 1000){
                //min ago
                return `${Math.floor((new Date().getTime() - timestamp * 1000) / (60 * 1000))} min ago`
            }
            return `${Math.floor((new Date().getTime() - timestamp * 1000 ) / (60 * 60 * 1000))} hours ago`
        } else {
            return timeTools.timestamp_to_str(timestamp, "yy-MM-dd hh:mm")
        }
    }
    static gallery_time_reformat(time_str){
        //转换时区并格式化画廊日期
        const timestamp = timeTools.gallery_time_str_to_timestamp(time_str)
        return timeTools.timestamp_to_str(timestamp, "yy-MM-dd hh:mm")
    }
} 