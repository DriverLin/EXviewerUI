
import { makeAutoObservable } from "mobx";

class GlobalState {
  g_data = {}
  download = {}
  favorite = {}
  card_info = {}
  keys={
    g_data:new Set(),
    download:new Set(),
    favorite:new Set(),
    card_info:new Set()
  }
  constructor() {
    makeAutoObservable(this);
    console.log("GlobalState init")
  }

  set_kv(attrName, key, value) {
    this[attrName][key] = value
    this.keys[attrName].add(key)
  }
  del_k(attrName, key) {
    delete this[attrName][key]
    this.keys[attrName].delete(key)
  }
  load_data(attrName, data) {
    console.time("load_data")
    this[attrName] = data
    this.keys[attrName] = new Set(Object.keys(data))
    console.timeEnd("load_data")
  }

  getEventHandeler(attrName) {
    return (...args) => {
      // console.log(...args)
      if (args[0] === 'set') {
        this.set_kv(attrName, args[1], args[2])
      } else if (args[0] === 'del') {
        this.del_k(attrName, args[1])
      } else if (args[0] === 'load') {
        this.load_data(attrName, args[1])
      }
    }
  }
}

const syncedDB = new GlobalState();


class DOWNLOAD_STATE{
  static NOT_DOWNLOADED = 0;
  static IN_QUEUE = 1;
  static NOW_DOWNLOADING = 2;
  static FINISHED = 3;
};
class FAVORITE_STATE{
  static NOT_FAVORITED = 0;
  static FETCHING = 1;
  static FAVORITED = 2;
}



export default syncedDB
export {
  DOWNLOAD_STATE,
  FAVORITE_STATE
}