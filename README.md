# EXviewer

E站的(PWA)客户端，于在线浏览，下载以及管理本地画廊。基于React与MaterialUI构建
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
创建server/config.json并填写cookie
```
{
    "DOWNLOAD_PATH":"./",
    "cookie": "ipb_member_id=***; ipb_pass_hash=***; igneous=***; sl=dm_1; sk=***; s=***"
}
```
运行
```
python server 
访问 http://YOUR_IP:7964 
```

## 部署到Heroku
使用Heroku托管运行

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://dashboard.heroku.com/new?template=https://github.com/DriverLin/EXviewerUI) 

## 环境变量

可使用环境变量来指定相关配置

如果指定了环境变量 则会忽略配置文件中的项

EHCOOKIE : cookie字符串

EH_DOWNLOAD_PATH : 下载路径

EH_CACHE_PATH : 缓存路径

PORT : 端口


