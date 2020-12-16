// Rank the invidious instances
// const api = require("./api.js");
const axios = require("axios").create({ timeout: 7000 });
const _ = require("lodash");
const urljoin = require("url-join");
const api = require("./api");

axios.interceptors.request.use(
  function (config) {
    config.timeData = { startTime: new Date() };
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  function (response) {
    const now = new Date();
    response.config.timeData.endTime = now;
    response.config.timeData.roundTrip =
      now - response.config.timeData.startTime;
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

async function instance_test(instances) {
  uri_results = {};
  const uris = instances.map((inst) => inst[1].uri);
  for (let instance_idx = 0; instance_idx < instances.length; instance_idx++) {
    const uri = uris[instance_idx];
    uri_results[uri] = [];
    console.log(uri);
    // verify videos available
    var videos_work = false;
    var videos_debug = [];
    try {
      const video_uri = urljoin(uri, "/watch?v=1WCsfcQgjk8");
      console.log("checking if videos work at:\n" + video_uri);
      const resp = await axios.get(video_uri, { timeout: 10000 });
      const kevbot_index = resp.data.toLowerCase().search("kevbot") > -1;
      const no_extract =
        resp.data.toLowerCase().search("could not extract video info.") === -1;
      videos_work = kevbot_index && no_extract;
      videos_debug = [kevbot_index, no_extract];
    } catch (error) {
      axios_error_log(error);
      videos_work = false;
    } finally {
      if (videos_work) {
        console.log("videos work");
      } else {
        console.log("no videos, fail");
      }
    }
    // check ping on homepage 3 times
    for (let attempt = 0; attempt < 3; attempt++) {
      var current;
      try {
        const resp = await axios.get(uri);
        const ping = _.get(resp, "config.timeData.roundTrip");
        const http_status = _.get(resp, "status");
        //prettier-ignore
        current = { ping, http_status, uri, videos_work, videos_debug, state: "pass" };
        if (!videos_work) current.state = "fail";
      } catch (error) {
        current = { state: "fail", videos_debug };
        console.log("error");
        axios_error_log(error);
      } finally {
        uri_results[uri].push(current);
        console.log(current);
      }
    }
  }
  return uri_results;
}

function summarize_uri_results(instances, uri_results) {
  let summaries = [];
  for (const instance of instances) {
    const uri = _.get(instance, "[1].uri");
    const results = uri_results[uri]; //.filter((e) => e.state === "pass");
    const all_pass = _.every(results, (e) => e.state === "pass");
    const videos_fork = _.get(results[0], "videos_work", false);
    out_obj = {
      uri,
      all_pass,
      pings: results.map((e) => _.get(e, "ping", Infinity)),
    };
    summaries.push(out_obj);
  }
  return summaries;
}
function order_summaries(summaries) {
  return summaries;
}

async function get_ranks() {
  let cached = api.cache.get("summaries");
  if (cached) {
    console.log("returning cached ranks");
    cached.cache_hit = true;
    return cached;
  }
  let { all_instances } = await api.get();
  //prettier-ignore
  let instances = all_instances // _.filter(all_instances, (e) => _.get(e, "[1].type") != "onion");
  // instances = instances.slice(0, 1);
  //prettier-ignore
  console.log('testing: ', instances.length, " instances");
  const uri_results = await instance_test(instances);
  let summaries = summarize_uri_results(instances, uri_results);
  summaries = order_summaries(summaries);
  api.cache.set("summaries", summaries, 0);
  return summaries;
}
// get_ranks(require("./api.json").filter((e) => _.get(e, "[1].type") != "onion"));

const main = async () => {
  console.log(await get_ranks());
};

module.exports = { get_ranks };

function axios_error_log(error) {
  return;
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
  console.log(error.config);
}
