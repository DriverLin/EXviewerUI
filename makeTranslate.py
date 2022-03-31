import json
from os import times

import requests

try:
    jsdata = requests.get("https://github.com/EhTagTranslation/Database/releases/latest/download/db.text.json").json()
except Exception as e:
        print("Failed to download newleast",e)
        exit(1)

outDict = {}


for item in jsdata["data"]:
    tagtype = item["namespace"]
    outDict[tagtype] = {}
    for key in item["data"].keys():
        value = item["data"][key]["name"]
        outDict[tagtype][key] = value

js = """//using data from https://github.com/EhTagTranslation/Database
const preciseQuery = [[[JSONRESUT]]]

export default function GetTranslate(type,value) {
    try { 
        const translated = preciseQuery[type][value]
        return translated === undefined ? value : translated 
    } catch (e) {
        return value
    }
}
export function getGuess(value) { 
    if (value === "") return []
    const guess = []
    for (let type of Object.keys(preciseQuery)) {
        for (let name of Object.keys(preciseQuery[type])) { 
            if (preciseQuery[type][name].includes(value) || name.includes(value)) { 
                guess.push({
                    type: type,
                    origin: name,
                    translated: preciseQuery[type][name]
                })
                if (guess.length > 25) {
                    return guess
                }
            }
        }
    }
    return guess
}


""".replace(
    "[[[JSONRESUT]]]", json.dumps(outDict, indent=4,ensure_ascii=True)
)

with open(
    r"C:\Users\lty65\projects\ExviewerUI\src\components\GetTranslate.js", "w", encoding="UTF-8"
) as f:
    f.write(js)
print("Successfully write to file")
