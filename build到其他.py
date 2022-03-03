import os
import shutil


#用iis开的静态服务器
shutil.rmtree(r'D:\REF_waterFallDemo')
shutil.copytree(r"C:\Users\lty65\projects\ExviewerUI\build",r'D:\REF_waterFallDemo')
with open(r"D:\REF_waterFallDemo\scripts\serverSideConfigure.js",'w') as f:
    f.write('window.serverSideConfigure={type: "Data.db"}')

#heroku项目
shutil.rmtree(r"C:\Users\lty65\projects\EXviewer\server")
shutil.copytree(r"C:\Users\lty65\projects\ExviewerUI\build",r"C:\Users\lty65\projects\EXviewer\server")


#本项目内服务器文件
shutil.rmtree(r"C:\Users\lty65\projects\ExviewerUI\server\server")
shutil.copytree(r"C:\Users\lty65\projects\ExviewerUI\build",r"C:\Users\lty65\projects\ExviewerUI\server\server")


print('copy to other done')