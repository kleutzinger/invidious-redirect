// todo
const axios = require("axios");
const fs = require("fs");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 * 24, checkperiod: 120 });
const EXTERNAL_API_ENDPOINT = `https://instances.invidio.us/instances.json?pretty=1&sort_by=type,users`;

async function check_cache() {
  // return false on miss, value on hit
  try {
    const value = myCache.get("all_instances");
    if (value == undefined) {
      // cache miss
      return false;
    } else {
      // cache hit
      return value;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getExternal() {
  try {
    const { data } = await axios.get(EXTERNAL_API_ENDPOINT);
    if (data) {
      return data;
    } else {
      throw new Error("no external data");
    }
  } catch (error) {
    console.log("error getting external instances", error);
  }
}

async function getInstances() {
  try {
    let cached_data = await check_cache();
    let all_instances;
    if (cached_data) {
      all_instances = cached_data;
      console.log("cache hit");
    } else {
      all_instances = await getExternal();
      console.log("cache miss, setting");
      myCache.set("all_instances", all_instances);
    }
    const out = { all_instances, best_uri: bestInstanceUri(all_instances) };
    return out;
  } catch (error) {
    console.log("error at api/get(), ", error);
    return {};
  }
}

function bestInstanceUri(data) {
  // get the uri from the instance with the most users
  return data[0][1].uri;
}

module.exports = { getInstances };
