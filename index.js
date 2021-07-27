var URL = require("url")
var promise = require("promise-polyfill")
var fetch = require("fetch-ponyfill")({ Promise: promise }).fetch
var escape = require("lodash.escape")

var YOUTUBE = "youtube"
var VIMEO = "vimeo"
var DAILYMOTION = "dailymotion"
var BILIBILI = "bilibili"
var ACFUN = "acfun"
var YOUKU = "youku"
var QQ = "qq"
var HUYA = "huya" //虎牙
var DOUYU = "douyu" //斗鱼
var MISSEVAN = "missevan" //猫耳FM
var NETEASE = "netease" //网易音乐

var validVimeoOpts = ["thumbnail_small", "thumbnail_medium", "thumbnail_large"]
var validYouTubeOpts = [
  "default",
  "mqdefault",
  "hqdefault",
  "sddefault",
  "maxresdefault",
]
var validDailyMotionOpts = [
  "thumbnail_60_url",
  "thumbnail_120_url",
  "thumbnail_180_url",
  "thumbnail_240_url",
  "thumbnail_360_url",
  "thumbnail_480_url",
  "thumbnail_720_url",
  "thumbnail_1080_url",
]

function embed(url, opts) {
  if (url.startsWith("<iframe")) return url
  var res = embed.info(url)
  return (
    res && embed[res.source] && embed[res.source](res.id, { ...res, ...opts })
  )
}

embed.info = function (url) {
  url = URL.parse(url, true)

  var id

  id = detectYoutube(url)
  if (id) {
    return {
      id: id,
      source: YOUTUBE,
      url: url.href,
      type: "video",
    }
  }

  id = detectVimeo(url)
  if (id) {
    return {
      id: id,
      source: VIMEO,
      url: url.href,
      type: "video",
    }
  }

  id = detectDailymotion(url)
  if (id) {
    return {
      id: id,
      source: DAILYMOTION,
      url: url.href,
      type: "video",
    }
  }

  var testBilibili = detectBilibili(url)
  if (testBilibili) {
    return {
      id: testBilibili[0],
      source: BILIBILI,
      url: url.href,
      type: "video",
      page: testBilibili[1] || 1,
      isAV: testBilibili[2],
    }
  }

  id = detectYouku(url)
  if (id) {
    return {
      id: id,
      source: YOUKU,
      url: url.href,
      type: "video",
    }
  }

  id = detectQq(url)
  if (id) {
    return {
      id: id,
      source: QQ,
      url: url.href,
      type: "video",
    }
  }

  id = detectHuya(url)
  if (id) {
    return {
      id: id,
      source: HUYA,
      url: url.href,
      type: "video",
    }
  }

  id = detectDouyu(url)
  if (id) {
    return {
      id: id,
      source: DOUYU,
      url: url.href,
      type: "video",
    }
  }
  id = detectMissevan(url)
  if (id) {
    return {
      id: id,
      source: MISSEVAN,
      url: url.href,
      type: "audio",
    }
  }

  id = detectAcfun(url)
  if (id) {
    return {
      id: id,
      source: ACFUN,
      url: url.href,
      type: "video",
    }
  }

  id = detectNetease(url)
  if (id) {
    return {
      id: id,
      source: NETEASE,
      url: url.href,
      type: "audio",
    }
  }
}

// For compat with <=2.0.1
embed.videoSource = embed.info

embed.image = function (url, opts, cb) {
  if (typeof opts === "function") {
    cb = opts
    opts = {}
  }
  opts = opts || {}

  var res = embed.info(url)
  if (!res && cb)
    return setTimeout(function () {
      cb()
    })
  return res && embed[res.source].image(res.id, { ...res, ...opts }, cb)
}
var VIMEO_MATCH_RE =
  /^(?:\/video|\/channels\/[\w-]+|\/groups\/[\w-]+\/videos)?\/(\d+)/

function detectVimeo(url) {
  var match
  return url.hostname === "vimeo.com" &&
    (match = VIMEO_MATCH_RE.exec(url.pathname))
    ? match[1]
    : null
}

function detectYoutube(url) {
  if (url.hostname.indexOf("youtube.com") > -1) {
    return url.query.v
  }

  if (url.hostname === "youtu.be") {
    return url.pathname.split("/")[1]
  }

  return null
}

function detectDailymotion(url) {
  if (url.hostname.indexOf("dailymotion.com") > -1) {
    return url.pathname.split("/")[2].split("_")[0]
  }

  if (url.hostname === "dai.ly") {
    return url.pathname.split("/")[1]
  }

  return null
}

var BILIBILI_AV_MATCH_RE = /(\/video\/av)(\d+)(\?p=(\d+))?/gi
var BILIBILI_MATCH_RE =
  /(\/video\/|\/medialist\/play\/.*\/)([^\?|\/]*)\/?(\?p=(\d+))?/gi
function detectBilibili(url) {
  var match
  BILIBILI_MATCH_RE.lastIndex = 0

  BILIBILI_AV_MATCH_RE.lastIndex = 0
  if (url.hostname.indexOf("bilibili.com") != -1) {
    ;(match = BILIBILI_AV_MATCH_RE.exec(url.href)) ? [match[2], match[4]] : null
    if (match) {
      return [match[2], match[4], true]
    }
    match = BILIBILI_MATCH_RE.exec(url.href)
    return match ? [match[2], match[4], false] : null
  }
}

var YOUKU_MATCH_RE = /\/v_show\/id_(.*)\.html/gi
function detectYouku(url) {
  var match
  YOUKU_MATCH_RE.lastIndex = 0
  return url.hostname.indexOf("youku.com") != -1 &&
    (match = YOUKU_MATCH_RE.exec(url.pathname))
    ? match[1]
    : null
}

var QQ_MATCH_RE = [
  "/x/cover/\\w+/(?<id>\\w+)\\.html",
  "/x/cover/\\w+\\.html\\?vid=(?<id>\\w+)",
  "/cover/[^/]+/\\w+/(?<id>\\w+)\\.html",
  "/cover/[^/]+/\\w+\\.html\\?vid=(?<id>\\w+)",
  "/x/page/(?<id>\\w+)\\.html",
  "/page/[^/]+/[^/]+/[^/]+/(?<id>\\w+)\\.html",
]
function detectQq(url) {
  if (url.hostname.indexOf("qq.com") != -1) {
    var match
    QQ_MATCH_RE.some(function (m) {
      match = new RegExp(m).exec(url.href)
      return match && match.groups["id"]
    })
    return match && match.groups["id"]
  }
  return null
}

var HUYA_MATCH_RE = /\/play\/(.*)\.html/gi
function detectHuya(url) {
  var match
  HUYA_MATCH_RE.lastIndex = 0
  return url.hostname.indexOf("huya.com") != -1 &&
    (match = HUYA_MATCH_RE.exec(url.pathname))
    ? match[1]
    : null
}

var DOUYU_MATCH_RE = /\/show\/(.*)/gi
function detectDouyu(url) {
  var match
  DOUYU_MATCH_RE.lastIndex = 0
  return url.hostname.indexOf("douyu.com") != -1 &&
    (match = DOUYU_MATCH_RE.exec(url.pathname))
    ? match[1]
    : null
}

var MISSEVAN_MATCH_RE = /\/albumiframe\/(.*)/gi
function detectMissevan(url) {
  var match
  MISSEVAN_MATCH_RE.lastIndex = 0
  return url.hostname.indexOf("missevan.com") != -1 &&
    (match = MISSEVAN_MATCH_RE.exec(url.pathname))
    ? match[1]
    : null
}

var ACFUN_MATCH_RE = /\/v\/(.*)/gi
function detectAcfun(url) {
  var match
  ACFUN_MATCH_RE.lastIndex = 0
  return url.hostname.indexOf("acfun.cn") != -1 &&
    (match = ACFUN_MATCH_RE.exec(url.pathname))
    ? match[1]
    : null
}
var NETEASE_MATCH_RE = /\/outchain\/\d\/(.*)/gi
function detectNetease(url) {
  var match
  NETEASE_MATCH_RE.lastIndex = 0
  return url.hostname.indexOf("music.163.com") != -1 &&
    (match = NETEASE_MATCH_RE.exec(url.hash))
    ? match[1]
    : null
}

embed.vimeo = function (id, opts) {
  opts = parseOptions(opts)
  return (
    '<iframe src="https://player.vimeo.com/video/' +
    id +
    opts.query +
    '"' +
    opts.attr +
    ' frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'
  )
}

embed.youtube = function (id, opts) {
  opts = parseOptions(opts)
  return (
    '<iframe src="https://www.youtube.com/embed/' +
    id +
    opts.query +
    '"' +
    opts.attr +
    ' frameborder="0" allowfullscreen></iframe>'
  )
}

embed.dailymotion = function (id, opts) {
  opts = parseOptions(opts)
  return (
    '<iframe src="https://www.dailymotion.com/embed/video/' +
    id +
    opts.query +
    '"' +
    opts.attr +
    ' frameborder="0" allowfullscreen></iframe>'
  )
}

embed.bilibili = function (id, opts) {
  opts = parseOptions(opts, true)
  return (
    '<iframe src="https://player.bilibili.com/player.html?&' +
    (opts.isAV ? "aid=" : "bvid=") +
    id +
    "&page=" +
    (opts.page || 1) +
    opts.query +
    '"' +
    opts.attr +
    ' scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
  )
}

embed.youku = function (id, opts) {
  opts = parseOptions(opts)
  return (
    '<iframe height=498 width=510 src="https://player.youku.com/embed/' +
    id +
    opts.query +
    '"' +
    opts.attr +
    ' scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
  )
}
embed.qq = function (id, opts) {
  opts = parseOptions(opts, true)
  return (
    '<iframe height=498 width=510 src="https://v.qq.com/iframe/player.html?vid=' +
    id +
    "&tiny=0&auto=0" +
    opts.query +
    '"' +
    opts.attr +
    ' frameborder="0" allowfullscreen></iframe>'
  )
}

embed.huya = function (id, opts) {
  opts = parseOptions(opts, true)
  return (
    '<iframe height=498 width=510 src="https://vhuya-static.huya.com/video/vppp.swf?&auto_play=0&vid=' +
    id +
    opts.query +
    '"' +
    opts.attr +
    ' scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
  )
}

embed.douyu = function (id, opts) {
  opts = parseOptions(opts, true)
  return (
    '<iframe height=498 width=510 src="https://v.douyu.com/video/share/index?vid=' +
    id +
    +"&tiny=0&auto=0" +
    opts.query +
    '"' +
    opts.attr +
    ' scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
  )
}

embed.missevan = function (id, opts) {
  opts = parseOptions(opts, true)
  return (
    '<iframe runat="server" src="https://www.missevan.com/soundiframe/' +
    id +
    '?type=small"' +
    opts.query +
    ' width="240px" height="40px" frameborder="no" border="0" marginwidth="0" marginheight="0" scrolling="no" ' +
    opts.attr +
    ' allowtransparency="yes"></iframe>'
  )
}

embed.acfun = function (id, opts) {
  opts = parseOptions(opts)
  return (
    '<iframe src="https://www.acfun.cn/player/' +
    id +
    opts.query +
    '"' +
    opts.attr +
    ' scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
  )
}
embed.netease = function (id, opts) {
  opts = parseOptions(opts, true)
  return (
    '<iframe src="https://music.163.com/outchain/player?type=2&id=' +
    id +
    "&auto=1&height=66" +
    opts.query +
    '" frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 ' +
    opts.attr +
    "></iframe>"
  )
}

embed.youtube.image = function (id, opts, cb) {
  if (typeof opts === "function") {
    cb = opts
    opts = {}
  }
  opts = opts || {}

  opts.image = validYouTubeOpts.indexOf(opts.image) > 0 ? opts.image : "default"

  var src = "//img.youtube.com/vi/" + id + "/" + opts.image + ".jpg"

  var result = {
    src: src,
    html: '<img src="' + src + '"/>',
  }

  if (!cb) return result.html

  setTimeout(function () {
    cb(null, result)
  })
}

embed.vimeo.image = function (id, opts, cb) {
  if (typeof opts === "function") {
    cb = opts
    opts = {}
  }

  if (!cb) throw new Error("must pass embed.vimeo.image a callback")

  opts = opts || {}

  opts.image =
    validVimeoOpts.indexOf(opts.image) >= 0 ? opts.image : "thumbnail_large"

  fetch("https://vimeo.com/api/v2/video/" + id + ".json")
    .then(function (res) {
      if (res.status !== 200) {
        throw new Error("unexpected response from vimeo")
      }

      return res.json()
    })
    .then(function (body) {
      if (!body || !body[0] || !body[0][opts.image]) {
        throw new Error("no image found for vimeo.com/" + id)
      }

      var src = body[0][opts.image].split(":")[1]

      var result = {
        src: src,
        html: '<img src="' + src + '"/>',
      }

      cb(null, result)
    })
    .catch(function (err) {
      cb(err)
    })
}

embed.dailymotion.image = function (id, opts, cb) {
  if (typeof opts === "function") {
    cb = opts
    opts = {}
  }

  if (!cb) throw new Error("must pass embed.dailymotion.image a callback")

  opts = opts || {}

  opts.image =
    validDailyMotionOpts.indexOf(opts.image) >= 0
      ? opts.image
      : "thumbnail_480_url"

  fetch("https://api.dailymotion.com/video/" + id + "?fields=" + opts.image)
    .then(function (res) {
      if (res.status !== 200) {
        throw new Error("unexpected response from dailymotion")
      }

      return res.json()
    })
    .then(function (body) {
      if (!body || !body[opts.image]) {
        throw new Error("no image found for dailymotion.com/" + id)
      }

      var src = body[opts.image]

      var result = {
        src: src,
        html: '<img src="' + src + '"/>',
      }

      cb(null, result)
    })
    .catch(function (err) {
      cb(err)
    })
}

function serializeQuery(query) {
  return Object.keys(query)
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(query[key])
    })
    .join("&")
}

function parseOptions(opts, withoutQM) {
  var queryString = ""
  var attributes = ""

  if (opts && opts.hasOwnProperty("query")) {
    queryString = withoutQM ? "&" : "?" + serializeQuery(opts.query)
  }

  if (opts && opts.hasOwnProperty("attr")) {
    attributes =
      " " +
      Object.keys(opts.attr)
        .map(function (key) {
          return key + '="' + escape(opts.attr[key]) + '"'
        })
        .join(" ")
  }

  return { query: queryString, attr: attributes }
}

module.exports = embed
