
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react";

class GlobalState {
  g_data = {}
  download = {}
  favorite = {}
  card_info = {}
  constructor() {
    makeAutoObservable(this);
    console.log("GlobalState init")
  }

  set_kv(attrName, key, value) {
    // console.time("set_kv")
    this[attrName][key] = value
    // console.timeEnd("set_kv")
  }
  del_k(attrName, key) {
    // this[attrName][key] = undefined
    delete this[attrName][key]
  }
  load_data(attrName, data) {
    console.time("load_data")
    this[attrName] = data
    console.timeEnd("load_data")
    console.log('data length = ',JSON.stringify(data).length)
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

export default syncedDB