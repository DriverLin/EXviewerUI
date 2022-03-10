
import { Grid, useMediaQuery } from "@mui/material";
import { makeStyles } from '@mui/styles';
import React from 'react';
import SelectType from "./AppSettingComponents/SelectType";
import SwitchType from "./AppSettingComponents/SwitchType";

const useStyles = makeStyles((theme) => ({

    splitLine: {
        width: "calc(100% - 40px)",
        height: "1px",
        marginLeft: "20px",
        marginRight: "20px",
        backgroundColor: theme.palette.text.secondary,
    },
    borderCard: {
        margin: "0 auto",
        marginTop: 40,
        marginBottom: 40,
        width: 754,
        borderRadius: 20,
        color: theme.palette.background.mainCard,
        boxShadow: theme.palette.page.shadow,
        overflow: "hidden",
        // padding: "0px",
    },
    matches_borderCard: {
        margin: "0 auto",
        marginBottom: 40,
        paddingBottom: "20px",
        color: theme.palette.background.mainCard,
        overflow: "hidden",
        // padding: "10 10px 0 10px",
    },
}));

export default function AppSetting(props) {
    const classes = useStyles();
    const matches = useMediaQuery('(min-width:800px)');

    return (
        <div className={matches ? classes.borderCard : classes.matches_borderCard}   >
            <Grid
                container
                direction="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                sx={{
                    with: "100%",
                }}
            >
                <Grid item xs={12} sx={{ width: "100%" }} >
                    <SwitchType
                        name={"下载时添加收藏"}
                        defaultValue={false}
                        help={(value) => value ? "下载画廊时添加到收藏夹" : "下载画廊时不添加到收藏夹"}
                    />
                </Grid>

                <div className={classes.splitLine} />
                
                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SwitchType
                        name={"删除时移除收藏"}
                        defaultValue={false}
                        help={(value) => value ? "删除下载的画廊时删除收藏" : "删除下载的画廊时不删除收藏"}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SelectType
                        name={"色彩主题"}
                        defaultValue={"暗色"}
                        values={["跟随系统","暗色","亮色"]}
                        help={(value) => `${value}`}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SelectType
                        name={"图片预加载"}
                        defaultValue={7}
                        values={[0, 3, 5, 7, 11, 13, 17]}
                        help={(value) => `向后预加载${value}张图片`}
                    />
                </Grid>

                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SelectType
                        name={"收藏夹"}
                        defaultValue={9}
                        values={[0,1,2,3,4,5,6,7,8,9]}
                        help={(value) => `使用收藏夹${value}`}
                    />
                </Grid>


                <div className={classes.splitLine} />

                <Grid item xs={12} sx={{ width: "100%" }}>
                    <SwitchType
                        name={"搜索本地并合并结果"}
                        defaultValue={false}
                        help={(value) => value ? "搜索画廊时同时搜索本地数据库,合并后优先展示在最前面" : "仅搜索在线画廊"}
                    />
                </Grid>
            </Grid>
        </div>
    )

}
