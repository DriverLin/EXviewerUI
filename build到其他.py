import os
import shutil


shutil.rmtree(r'D:\REF_waterFallDemo')
shutil.copytree(r"D:\refacted_exviewer\build",r'D:\REF_waterFallDemo')
with open(r"D:\REF_waterFallDemo\scripts\serverSideConfigure.js",'w') as f:
    f.write('window.serverSideConfigure={type: "Data.db"}')

shutil.rmtree(r"D:\EXviewer\server")
shutil.copytree(r"D:\refacted_exviewer\build",r"D:\EXviewer\server")



shutil.rmtree(r"D:\refacted_exviewer\server\server")
shutil.copytree(r"D:\refacted_exviewer\build",r"D:\refacted_exviewer\server\server")


print('copy to other done')