import os
import shutil


shutil.rmtree(r'D:\REF_waterFallDemo')
shutil.copytree(r"C:\Users\lty65\projects\ExviewerUI\build",r'D:\REF_waterFallDemo')
with open(r"D:\REF_waterFallDemo\scripts\serverSideConfigure.js",'w') as f:
    f.write('window.serverSideConfigure={type: "Data.db"}')

shutil.rmtree(r"C:\Users\lty65\projects\EXviewer\server")
shutil.copytree(r"C:\Users\lty65\projects\ExviewerUI\build",r"C:\Users\lty65\projects\EXviewer\server")



shutil.rmtree(r"D:\refacted_exviewer\server\server")
shutil.copytree(r"C:\Users\lty65\projects\ExviewerUI\build",r"D:\refacted_exviewer\server\server")


print('copy to other done')