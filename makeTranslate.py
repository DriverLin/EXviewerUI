import json
from os import times

jsdata = json.loads(open(r"D:\refacted_exviewer\src\components\db.text.json",encoding="utf-8").read())

outDict = {}


for item in jsdata["data"]:
    tagtype = item["namespace"]
    outDict[tagtype] = {}
    for key in item["data"].keys():
        value = item["data"][key]["name"]
        outDict[tagtype][key] = value

js = '''const preciseQuery = JSONRESUT

export default function GetTranslate(type,value) {
    try { 
        return preciseQuery[type][value] === undefined ? value : preciseQuery[type][value]
    } catch (e) {
        return type
    }
}'''.replace("JSONRESUT",json.dumps(outDict,indent=4))


with open(r"D:\refacted_exviewer\src\components\GetTranslate.js",'w',encoding="UTF-8") as f:
    f.write(js)
