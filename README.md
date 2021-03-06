# EXviewer

E站的PWA客户端，于在线浏览，下载以及管理本地画廊。基于React与MaterialUI构建

[在线演示](https://driverlin.github.io/EXviewerUI/)


## 截图

<div style="display: flex;">
<img src="https://raw.githubusercontent.com/DriverLin/EXviewerUI/master/Screenshot/IMG_0006.jpg" width="30%" title="home"/>
<img src="https://raw.githubusercontent.com/DriverLin/EXviewerUI/master/Screenshot/IMG_0012.jpg" width="30%" title="home" />
<img src="https://raw.githubusercontent.com/DriverLin/EXviewerUI/master/Screenshot/IMG_0007.jpg" width="30%" title="home" />
</div>
<div style="display: flex;">
<img src="https://raw.githubusercontent.com/DriverLin/EXviewerUI/master/Screenshot/Screenshot_20220613-210439.jpg" width="30%" title="home" />
<img src="https://raw.githubusercontent.com/DriverLin/EXviewerUI/master/Screenshot/Screenshot_20220613-210111.jpg" width="30%" title="detail"/>
<img src="https://raw.githubusercontent.com/DriverLin/EXviewerUI/master/Screenshot/Screenshot_20220613-210501.jpg" width="30%" title="detail"/>
</div>

## 本地部署

```
git clone https://github.com/DriverLin/EXviewerUI
cd EXviewerUI
pip install -r requirements.txt
```
修改server/config.json，填写cookie
```
{
    "EH_DOWNLOAD_PATH": "",
    "EH_CACHE_PATH": "",
    "EH_COOKIE": "ipb_member_id=***; ipb_pass_hash=***; igneous=***; sl=dm_1; sk=***; s=***",
    "UTC_OFFSET": "+08",
    "PORT": 7964
}
```
运行
```
python server 
访问 http://IP:PORT 
将网站作为APP安装到桌面
```

## 部署到Heroku
使用Heroku托管运行

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://dashboard.heroku.com/new?template=https://github.com/DriverLin/EXviewerUI) 

## 环境变量

使用环境变量来指定相关配置

如果指定了环境变量 则会忽略配置文件中的项

EH_COOKIE : cookie字符串

EH_DOWNLOAD_PATH : 下载路径

EH_CACHE_PATH : 缓存路径

PORT : 端口

## 致谢

- UI参考 [seven332/EhViewer](https://github.com/seven332/EhViewer)
- 翻译数据 [EhTagTranslation](https://github.com/EhTagTranslation/Database)

