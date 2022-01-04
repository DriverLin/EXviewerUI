import json
from os import times
import requests


def download_newleast(releaseUrl):
    try:
        print("fetching release from ", releaseUrl)
        result = requests.get(releaseUrl).json()
        print("fetching release done")
        for asset in result["assets"]:
            name = asset["name"]
            if name == "db.text.json":
                print("Downloading " + name + " from " + asset["browser_download_url"])
                file = requests.get(asset["browser_download_url"])
                print("Downloaded " + name + " successfully")
                return file.json()
        return None
    except Exception as e:
        print(e)
        return None


jsdata = download_newleast(
    "https://api.github.com/repos/EhTagTranslation/Database/releases/latest"
)
if jsdata is None:
    print("Failed to download newleast")
    exit(1)

outDict = {}


for item in jsdata["data"]:
    tagtype = item["namespace"]
    outDict[tagtype] = {}
    for key in item["data"].keys():
        value = item["data"][key]["name"]
        outDict[tagtype][key] = value

js = """const preciseQuery = [[[JSONRESUT]]]

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
    r"D:\refacted_exviewer\src\components\GetTranslate.js", "w", encoding="UTF-8"
) as f:
    f.write(js)
print("Successfully write to file")
