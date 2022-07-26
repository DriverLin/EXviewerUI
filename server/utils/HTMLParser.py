import re
import time
from typing import List, Any

from lxml import etree
from utils.tools import printPerformance, timestamp_to_str


def setParserUtcOffset(num):
    global UTC_OFFSET
    UTC_OFFSET = num


COLOR_FAVORITE_MAP = {
    '000': 0,
    'f00': 1,
    'fa0': 2,
    'dd0': 3,
    '080': 4,
    '9f4': 5,
    '4b6': 6,
    '00f': 7,
    '508': 8,
    'e8e': 9,
}


class CardInfoType:
    FROM_G_DATA: str = 'from_g_data'
    THUMBNAIL: str = 'thumbnail'
    EXTENDED: str = 'extended'
    COMPACT: str = 'compact'
    MINIMAL_PLUS: str = 'minimal+'
    MINIMAL: str = 'minimal'


class MainPageParser():
    @staticmethod
    def getRankFromStyle(rankStyleText: str):
        a, b, op = re.findall(
            r'background-position:(-?\d+)px (-?\d+)px;opacity:(.+)', rankStyleText)[0]
        a_val = (5 - (int(a)/-16))*2
        return a_val/2 if b == '-21' else (a_val - 1)/2

    @staticmethod
    def formatUploadTime(uploadText):
        utcTimestamp = int(time.mktime(
            time.strptime(uploadText,  "%Y-%m-%d %H:%M", )))
        return timestamp_to_str("%Y-%m-%d %H:%M",  utcTimestamp + UTC_OFFSET)

    @staticmethod
    def getFavoriteIndex(favoriteStyle):
        return COLOR_FAVORITE_MAP[favoriteStyle[0][14:17]] if len(favoriteStyle) == 1 else -1

    @staticmethod
    def minimal(root: Any) -> List[dict]:
        infos = []
        for elem in root.xpath('//table[@class="itg gltm"]/tr[position()>1]'):
            href = elem.xpath('./td[@class="gl3m glname"]/a/@href')[0]
            gid = int(href.split("/")[-3])
            token = href.split("/")[-2]
            imgElem = elem.xpath(
                './td[@class="gl2m"]/div[@class="glthumb"]/div/img')[0]
            src = imgElem.xpath('./@src')
            data_src = imgElem.xpath('./@data-src')
            rankStyleText = elem.xpath(
                './td[@class="gl4m"]/div[contains(@class,"ir")]/@style')[0]
            uploadText = elem.xpath('./td[@class="gl2m"]/div[3]/text()')
            if len(uploadText) == 0:
                uploadText = elem.xpath('./td[@class="gl2m"]/div[3]/s/text()')[0]
            else:
                uploadText = uploadText[0]
            infos.append(
                {
                    "type": CardInfoType.MINIMAL,
                    "gid": gid,
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "rawSrc": data_src[0] if len(data_src) != 0 else src[0],
                    "name": elem.xpath('./td[@class="gl3m glname"]/a/div[@class="glink"]/text()')[0],
                    "rank": str(MainPageParser.getRankFromStyle(rankStyleText)),
                    "category": elem.xpath('td[@class="gl1m glcat"]/div/text()')[0],
                    "uploadTime": MainPageParser.formatUploadTime(uploadText),
                    "lang": "",
                    "pages": int(elem.xpath('./td[@class="gl2m"]/div[@class="glthumb"]/div/div[2]/div/text()')[0].split(" ")[0]),
                    'favoriteIndex': MainPageParser.getFavoriteIndex(elem.xpath('./td[@class="gl2m"]/div[3]/@style')),
                    "tags": []
                }
            )
        return infos

    @staticmethod
    def minimalPlus(root: Any) -> List[dict]:
        infos = []
        for elem in root.xpath('//table[@class="itg gltm"]/tr[position()>1]'):
            href = elem.xpath('./td[@class="gl3m glname"]/a/@href')[0]
            gid = int(href.split("/")[-3])
            token = href.split("/")[-2]
            imgElem = elem.xpath(
                './td[@class="gl2m"]/div[@class="glthumb"]/div/img')[0]
            src = imgElem.xpath('./@src')
            data_src = imgElem.xpath('./@data-src')
            rankStyleText = elem.xpath(
                './td[@class="gl4m"]/div[contains(@class,"ir")]/@style')[0]
            uploadText = elem.xpath('./td[@class="gl2m"]/div[3]/text()')
            if len(uploadText) == 0:
                uploadText = elem.xpath('./td[@class="gl2m"]/div[3]/s/text()')[0]
            else:
                uploadText = uploadText[0]
            lang = elem.xpath('./td[@class="gl3m glname"]/a/div[@class="gltm"]/div[@class="gt"]/text()')
            if len(lang) == 0:
                lang = ""
            else:
                lang = lang[0]
            infos.append(
                {
                    "type": CardInfoType.MINIMAL_PLUS,
                    "gid": gid,
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "rawSrc": data_src[0] if len(data_src) != 0 else src[0],
                    "name": elem.xpath('./td[@class="gl3m glname"]/a/div[@class="glink"]/text()')[0],
                    "rank": str(MainPageParser.getRankFromStyle(rankStyleText)),
                    "category": elem.xpath('td[@class="gl1m glcat"]/div/text()')[0],
                    "uploadTime": MainPageParser.formatUploadTime(uploadText),
                    "lang": lang,
                    "pages": int(elem.xpath('./td[@class="gl2m"]/div[@class="glthumb"]/div/div[2]/div/text()')[0].split(" ")[0]),
                    'favoriteIndex': MainPageParser.getFavoriteIndex(elem.xpath('./td[@class="gl2m"]/div[3]/@style')),
                    "tags": []
                }
            )
        return infos

    @staticmethod
    def compact(root: Any) -> List[dict]:
        infos = []
        for elem in root.xpath('//table[@class="itg gltc"]/tr[position()>1]'):
            href = elem.xpath('./td[@class="gl3c glname"]/a/@href')[0]
            gid = int(href.split("/")[-3])
            token = href.split("/")[-2]
            imgElem = elem.xpath('./td[@class="gl2c"]/div[@class="glthumb"]/div/img')[0]
            src = imgElem.xpath('./@src')
            data_src = imgElem.xpath('./@data-src')
            rankStyleText = elem.xpath( './td[@class="gl2c"]/div[3]/div[contains(@class,"ir")]/@style')[0]
            uploadText = elem.xpath('./td[@class="gl2c"]/div[3]/div[1]/text()')
            if len(uploadText) == 0:
                uploadText = elem.xpath('./td[@class="gl2c"]/div[3]/div[1]/s/text()')[0]
            else:
                uploadText = uploadText[0]
            tags = elem.xpath('./td[@class="gl3c glname"]/a/div/div[@class="gt"]/@title')
            infos.append(
                {
                    "type": CardInfoType.COMPACT,
                    "gid": gid,
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "rawSrc": data_src[0] if len(data_src) != 0 else src[0],
                    "name": elem.xpath('./td[@class="gl3c glname"]/a/div[@class="glink"]/text()')[0],
                    "rank": str(MainPageParser.getRankFromStyle(rankStyleText)),
                    "category": elem.xpath('td[@class="gl1c glcat"]/div/text()')[0],
                    "uploadTime": MainPageParser.formatUploadTime(uploadText),
                    "lang": "chinese" if "language:chinese" in tags else "",
                    "pages": int(elem.xpath('./td[@class="gl2c"]/div[@class="glthumb"]/div[2]/div[2]/div[2]/text()')[0].split(" ")[0]),
                    'favoriteIndex': MainPageParser.getFavoriteIndex(elem.xpath('./td[@class="gl2c"]/div[3]/div[1]/@style')),
                    "tags": tags
                }
            )
        return infos


    @staticmethod
    def extended(root: Any) -> List[dict]:
        infos = []
        for elem in root.xpath('//table[@class="itg glte"]/tr'):
            href = elem.xpath('./td[@class="gl2e"]/div/a/@href')[0]
            gid = int(href.split("/")[-3])
            token = href.split("/")[-2]
            rankStyleText = elem.xpath('.//div[@class="gl3e"]/div[contains(@class,"ir")]/@style')[0]
            category=elem.xpath('.//div[@class="gl3e"]/div[1]/text()')[0]
            pagesText= elem.xpath('.//div[@class="gl3e"]/div[5]/text()')[0]
            uploadText = elem.xpath('.//div[@class="gl3e"]/div[2]/text()')
            if len(uploadText) == 0:
                uploadText = elem.xpath('.//div[@class="gl3e"]/div[2]/s/text()')
            else:
                uploadText = uploadText[0]
            tags = elem.xpath('.//div[@class="gt"]/@title')
            infos.append(
                {
                    "type": CardInfoType.EXTENDED,
                    "gid": gid,
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "rawSrc": elem.xpath(".//img/@src")[0],
                    "name": elem.xpath('.//div[@class="glink"]/text()')[0],
                    "rank": str(MainPageParser.getRankFromStyle(rankStyleText)),
                    "category": category,
                    "uploadTime": MainPageParser.formatUploadTime(uploadText),
                    "lang": "chinese" if "language:chinese" in tags else "",
                    "pages": int(pagesText.split(" ")[0]),
                    'favoriteIndex': MainPageParser.getFavoriteIndex(elem.xpath(".//div[@class='gl3e']/div[2]/@style")),
                    "tags": tags
                }
            )
        return infos        
  
    @staticmethod
    def thumbnail(root: Any) -> List[dict]:
        infos = []
        for elem in root.xpath("//div[@class='gl1t']"):
            href = elem.xpath(".//a/@href")[0]
            gid = int(href.split("/")[-3])
            token = href.split("/")[-2]
            rankStyleText = elem.xpath('div[@class="gl5t"]/div/div[contains(@class,"ir")]/@style')[0]
            c_u_p_s = elem.xpath("div[@class='gl5t']/div/div/text()")
            if len(c_u_p_s) == 3:
                [category, uploadText, pagesText] = c_u_p_s  # 正常
            else:
                [category, pagesText] = c_u_p_s
                uploadText = elem.xpath(  "div[@class='gl5t']/div/div/s/text()")[0]  # 已删除的画廊
            lang = elem.xpath("div[@class='gl6t']/div/text()")
            lang = lang[0] if len(lang) == 1 else ""
            infos.append(
                {
                    "type": CardInfoType.THUMBNAIL,
                    "gid": gid,
                    "token": token,
                    "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                    "rawSrc": elem.xpath("div[@class='gl3t']/a/img/@src")[0],
                    "name": elem.xpath('.//div[contains(@class,"glink")]/text()')[0],
                    "rank": str(MainPageParser.getRankFromStyle(rankStyleText)),
                    "category": category,
                    "uploadTime": MainPageParser.formatUploadTime(uploadText),
                    "lang": lang,
                    "pages": int(pagesText.split(" ")[0]),
                    'favoriteIndex': MainPageParser.getFavoriteIndex(elem.xpath("div[@class='gl5t']/div/div[2]/@style")),
                    "tags": []
                }
            )
        return infos


def parseMainPage(html: str) -> List[object]:
    xml = etree.HTML(html)
    select = xml.xpath( '//*[@id="dms"]/div/select/option[@selected="selected"]/@value')[0]
    if select == "t":  # Thumbnail
        return MainPageParser.thumbnail(xml)
    if select == "e":  # Extended
        return MainPageParser.extended(xml)
    if select == "l":  # Compact
        return MainPageParser.compact(xml)
    if select == "p":  # Minimal+
        return MainPageParser.minimalPlus(xml)
    if select == "m":  # Minimal
        return MainPageParser.minimal(xml)


CLASS_RATING_COLOR_MAP = {
    "ir": "",
    "ir irg": "#009688",
    "ir irr": "#d90051",
    "ir irb": "#0288D1"
}

# @printPerformance


def getG_dataFromGalleryPage(html: str) -> object:
    xml = etree.HTML(html)
    urlSplit = xml.xpath("//td[@class='ptds']/a/@href")[0].split("/")
    gid = int(urlSplit[-3])
    token = urlSplit[-2]
    archiver_key = "ignored"
    title = xml.xpath('//h1[@id="gn"]/text()')[0]
    title_jpn = xml.xpath('//h1[@id="gj"]/text()')
    if len(title_jpn) == 0:
        title_jpn = ""
    else:
        title_jpn = title_jpn[0]
    category = xml.xpath('//div[@id="gdc"]/div/text()')[0]
    thumb = xml.xpath('//div[@id="gd1"]/div/@style')[0][54:-11]
    uploader_text = xml.xpath('//div[@id="gdn"]/a/text()')
    if len(uploader_text) == 0:
        uploader = "(Disowned)"
    else:
        uploader = uploader_text[0]

    [Posted, parent, Visible, lang, FileSize, Length, favoriteTimes] = xml.xpath(
        '//div[@id="gdd"]//td[@class="gdt2"]')

    utcTime = int(time.mktime(time.strptime(Posted.text, "%Y-%m-%d %H:%M")))
    posted = utcTime+UTC_OFFSET
    filecount = Length.text.split(" ")[0]
    fileSizeText, fileSizeUnit = FileSize.text.split(" ")
    filesize = int(
        float(fileSizeText)
        * {"KB": 1024, "MB": 1048576, "GB": 1073741824}[fileSizeUnit]
    )
    expunged = Visible.text != "Yes"

    ratingText = xml.xpath('//td[@id="rating_label"]/text()')[0]
    if ratingText == "Not Yet Rated":
        rating = '0'
    else:
        rating = ratingText.split(" ")[1]

    ratingStarClass = xml.xpath('//div[@id="rating_image"]/@class')[0]
    userRankColor = CLASS_RATING_COLOR_MAP[ratingStarClass]
    if ratingStarClass == "ir":
        userRankValue = -1  # 用户没有评分
    else:
        ratingStarStyle = xml.xpath('//div[@id="rating_image"]/@style')[0]
        apx_bpx = re.findall("-?[0-9]+px -?[0-9]+px", ratingStarStyle)[0]
        rank_a, rank_b = re.findall("-?[0-9]+px", apx_bpx)
        rank_a = int(rank_a[:-2])
        rank_b = int(rank_b[:-2])
        userRankValue = (5 - int(rank_a / -16)) * 2
        userRankValue = (userRankValue-1 if rank_b == -
                         21 else userRankValue) / 2  # -21半星
    torrentcount = xml.xpath('//*[@id="gd5"]/p[3]/a/text()')[0][18:-1]
    torrents = []
    tags = []
    for row in xml.xpath('//div[@id="taglist"]//tr'):
        row_name = row.xpath('td/text()')[0]
        tag_texts = row.xpath('td/div/a/text()')
        tags.extend([row_name + x for x in tag_texts])
    favoriteText = xml.xpath('//a[@id="favoritelink"]/text()')[0]
    if favoriteText == " Add to Favorites":
        favoriteState = -1
    else:
        favoriteIcon = xml.xpath('//div[@id="fav"]/div/@style')[0]
        position = favoriteIcon[80:-20]
        favoriteState = ["-2", "-21", "-40", "-59", "-78", "-97",
                         "-116", "-135", "-154", "-173"].index(position)
    g_data = {
        "gid": gid,
        "token": token,
        "archiver_key": archiver_key,
        "title": title,
        "title_jpn": title_jpn,
        "category": category,
        "thumb": thumb,
        "uploader": uploader,
        "posted": posted,
        "filecount": filecount,
        "filesize": filesize,
        "expunged": expunged,
        "rating": rating,
        "torrentcount": torrentcount,
        "torrents": torrents,
        "tags": tags,
        "extended": {
            "favoriteIndex": favoriteState,  # int: -1:未收藏 0-9:收藏夹编号
            "userRankValue": userRankValue,  # int: -1 未评分 0-5 用户评分
            "userRankColor": userRankColor,
        },
    }
    return g_data


# @printPerformance
def getCommentsFromGalleryPage(html: str) -> List[object]:
    result = []
    xml = etree.HTML(html)
    canVote = False  # 默认不可投票 检测到投票按钮则允许
    for comment in xml.xpath('//div[@class="c1"]'):
        canEdit = False
        vote = 0
        score = comment.xpath(
            'div[@class="c2"]/div[@class="c5 nosel"]/span/text()')
        score = "" if len(score) == 0 else score[0]
        c4Nosel = comment.xpath('div[@class="c2"]/div[@class="c4 nosel"]/a')
        if len(c4Nosel) == 2:
            canVote = True
            if c4Nosel[0].xpath('@style')[0] != "":
                vote = 1
            if c4Nosel[1].xpath('@style')[0] != "":
                vote = -1
        elif len(c4Nosel) == 1 and score != "":
            canEdit = True
        commentID = int(comment.xpath('div[@class="c6"]/@id')[0].split("_")[1])
        raw_comment_text = etree.tostring(comment.xpath(
            'div[@class="c6"]')[0],   method="html").decode('utf-8')
        comment_html = raw_comment_text.replace(
            "https://exhentai.org/g/", "/#/g/"
        ).replace(
            "https://exhentai.org/t/", "https://ehgt.org/t/"
        )
        comment_text = "".join([x+"\n" for x in comment.xpath(
            'div[@class="c6"]//text()') if x != ""])
        if len(comment_text) > 40:
            comment_short = (comment_text[:40] + "...").replace("\n", " ")
        else:
            comment_short = comment_text.replace("\n", " ")
        poster_elem = comment.xpath(
            'div[@class="c2"]/div[@class="c3"]/a/text()')
        if len(poster_elem) == 1:
            poster = poster_elem[0]
        else:
            poster = ""

        post_date = comment.xpath(
            'div[@class="c2"]/div[@class="c3"]/text()')[0].split(" by: ")[0][10:]

        result.append(
            {
                "poster": poster,
                "post_date": post_date,
                "score": score,
                "html": comment_html,
                "text": comment_text,
                "short": comment_short,
                "isSelf": canEdit,
                "isUploader": score == "",
                "vote": vote,
                "commentID": commentID,
            }
        )
    return {
        "data": result,
        "all": len(xml.xpath('//div[@id="chd"]/p/a')) == 1,
        "canVote": canVote,
    }

# @printPerformance


def getInfoFromViewingPage(html):
    skipHathKey = re.findall(r"onclick=\"return nl\('([^\)]+)'\)", html)
    if len(skipHathKey) != 0:
        skipHathKey = skipHathKey[0]
    else:
        skipHathKey = ""
    imgSrc = re.findall(r"<img id=\"img\" src=\"([^\"]+)\"", html)[0]
    return (skipHathKey, imgSrc)


# @printPerformance
def getViewInfoFromPage(html):
    return [
        (
            elem.xpath("a/@href")[0],
            elem.xpath("a/img/@src")[0]
        )for elem in etree.HTML(html).xpath('//div[@class="gdtl"]')
    ]
