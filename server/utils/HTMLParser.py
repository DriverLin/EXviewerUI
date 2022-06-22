import re
import time
from typing import List

from lxml import etree

from utils.tools import printPerformance, timestamp_to_str

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

# @printPerformance


def parseMainPage(html: str) -> List[object]:
    infos = []
    for elem in etree.HTML(html).xpath("//div[@class='gl1t']"):
        href = elem.xpath(".//a/@href")[0]
        gid = int(href.split("/")[-3])
        token = href.split("/")[-2]
        rawSrc = elem.xpath("div[@class='gl3t']/a/img/@src")[0]
        name = elem.xpath('.//*[contains(@class,"glink")]/text()')[0]

        rankText = elem.xpath(
            'div[@class="gl5t"]/div/div[contains(@class,"ir")]/@style')[0]

        rankText.replace("background-position:0px -21px;opacity:1", "")
        rankValue = re.findall("-?[0-9]+px -?[0-9]+px", rankText)[0]
        rank_a, rank_b = re.findall("-?[0-9]+px", rankText)
        rank_a = int(rank_a[:-2])
        rank_b = int(rank_b[:-2])
        rankValue = (5 - int(rank_a / -16)) * 2
        rankValue = (rankValue-1 if rank_b == -21 else rankValue) / 2  # -21半星

        c_u_p_s = elem.xpath("div[@class='gl5t']/div/div/text()")
        if len(c_u_p_s) == 3:
            [category, uploadText, pagesText] = c_u_p_s  # 正常
        else:
            [category, pagesText] = c_u_p_s
            uploadText = elem.xpath(
                "div[@class='gl5t']/div/div/s/text()")[0]  # 已删除的画廊
        timestamp = int(
            time.mktime(
                time.strptime(
                    uploadText,
                    "%Y-%m-%d %H:%M",
                )
            )
        )+8*60*60
        uploadTime = timestamp_to_str("%Y-%m-%d %H:%M",  timestamp)

        favoriteStyle = elem.xpath("div[@class='gl5t']/div/div[2]/@style")
        if len(favoriteStyle) == 1:
            favoriteIndex = COLOR_FAVORITE_MAP[favoriteStyle[0][14:17]]
        else:
            favoriteIndex = -1
        lang = elem.xpath("div[@class='gl6t']/div/text()")
        lang = lang[0] if len(lang) == 1 else ""
        pages = int(pagesText.split(" ")[0])
        infos.append(
            {
                "gid": gid,
                "token": token,
                "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                "rawSrc": rawSrc,
                "name": name,
                "rank": str(rankValue),
                "category": category,
                "uploadTime": uploadTime,
                "lang": lang,
                "pages": pages,
                'favoriteIndex': favoriteIndex
            }
        )
    return infos


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

    posted = int(time.mktime(time.strptime(
        Posted.text, "%Y-%m-%d %H:%M")))+8*60*60
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
    for comment in xml.xpath('//div[@class="c1"]'):
        # score = comment.select("div.c5.nosel > span")
        score = comment.xpath(
            'div[@class="c2"]/div[@class="c5 nosel"]/span/text()')
        if len(score) == 0:
            score = ""
        else:
            score = score[0]

        raw_comment_text = etree.tostring(comment.xpath(
            'div[@class="c6"]')[0],   method="html").decode('utf-8')
        comment_text = raw_comment_text.replace(
            "https://exhentai.org/g/", "/#/g/").replace(
            "https://exhentai.org/t/", "https://ehgt.org/t/"
        )
        comment_short = "".join([x for x in comment.xpath(
            'div[@class="c6"]/text()')])
        if len(comment_short) > 40:
            comment_short = comment_short[:40] + "..."

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
                "html": comment_text,
                "short": comment_short,
            }
        )
    return {
        "data": result,
        "all": len(xml.xpath('//div[@id="chd"]/p')) == 1,
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
