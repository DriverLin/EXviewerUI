import json
import re
import time
from typing import List

from bs4 import BeautifulSoup
from lxml import etree

from utils.tools import printPerformance, timestamp_to_str

# from tools import printPerformance, timestamp_to_str


# @printPerformance
def __parseMainPage(html: str) -> List[object]:
    soup = BeautifulSoup(html, features="html.parser")
    infos = []
    mainElem = soup.select("div.gl1t")
    for elem in mainElem:
        href = elem.select_one("a:nth-child(1)").get("href")
        gid = int(href.split("/")[-3])
        token = href.split("/")[-2]
        rawSrc = (
            elem.select_one("div.gl3t > a > img")
            .get("src")
        )
        nameElem = elem.select_one(
            "div.gl4t.glname.glink") or elem.select_one("span.glink")
        name = nameElem.text
        rankText = elem.select_one(
            "div.gl5t > div:nth-child(2) > div:nth-child(1)").get("style")
        rankText.replace("background-position:0px -21px;opacity:1", "")
        rankValue = re.findall("-?[0-9]+px -?[0-9]+px", rankText)[0]
        rank_a, rank_b = re.findall("-?[0-9]+px", rankText)
        rank_a = int(rank_a[:-2])
        rank_b = int(rank_b[:-2])
        rankValue = (5 - int(rank_a / -16)) * 2
        rankValue = rankValue-1 if rank_b == -21 else rankValue  # -21半星
        category = elem.select_one(
            "div.gl5t > div:nth-child(1) > div:nth-child(1)"
        ).text
        timestamp = int(
            time.mktime(
                time.strptime(
                    elem.select_one("div.gl5t > div > div:nth-child(2)").text,
                    "%Y-%m-%d %H:%M",
                )
            )
        )+8*60*60
        uploadTime = timestamp_to_str("%Y-%m-%d %H:%M",  timestamp)
        favorite = (
            elem.select_one(
                "div.gl5t > div > div:nth-child(2)").get("style")
            != None
        )  # 获取到远程画廊是收藏的 但是此时不能获取到编号
        lang = elem.select_one("div.gl6t > div")
        lang = lang.text if lang is not None else ""
        pages = elem.select_one(
            "div.gl5t > div:nth-child(2) > div:nth-child(2)").text.split(" ")[0]
        infos.append(
            {
                "gid": gid,
                "token": token,
                "imgSrc": "/cover/{}_{}.jpg".format(gid, token),
                "rawSrc": rawSrc,
                "name": name,
                "rank": rankValue / 2,
                "category": category,
                "uploadTime": uploadTime,
                "lang": lang,
                "pages": pages,
                "favorite": favorite
            }
        )
    return infos


# @printPerformance
def parseMainPage(html: str) -> List[object]:
    infos = []
    for elem in etree.HTML(html).xpath("//div[@class='gl1t']"):
        href = elem.xpath("*/a/@href")[0]
        gid = int(href.split("/")[-3])
        token = href.split("/")[-2]
        rawSrc = elem.xpath("div[@class='gl3t']/a/img/@src")[0]
        nameElem = elem.xpath(
            "a/div[@class='gl4t glname glink']/text()")  # main
        if len(nameElem) == 0:
            nameElem = elem.xpath(
                "div/div/a/span[@class='glink']/text()")  # favorite
        name = nameElem[0]
        rankText = elem.xpath(
            'div[@class="gl5t"]/div/div[@class="ir"]/@style')[0]
        rankText.replace("background-position:0px -21px;opacity:1", "")
        rankValue = re.findall("-?[0-9]+px -?[0-9]+px", rankText)[0]
        rank_a, rank_b = re.findall("-?[0-9]+px", rankText)
        rank_a = int(rank_a[:-2])
        rank_b = int(rank_b[:-2])
        rankValue = (5 - int(rank_a / -16)) * 2
        rankValue = (rankValue-1 if rank_b == -21 else rankValue) / 2  # -21半星
        cups = elem.xpath("div[@class='gl5t']/div/div/text()")
        if len(cups) == 3:
            [category, uploadText, pagesText] = cups  # 正常
        else:
            [category, pagesText] = cups
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
        favorite = len(elem.xpath("div[@class='gl5t']/div/div[2]/@style")) != 0
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
                "favorite": favorite
            }
        )
    return infos


# @printPerformance
def __getG_dataFromGalleryPage(html: str) -> object:
    soup = BeautifulSoup(html, features="html.parser")
    urlSplit = soup.select_one("td.ptds > a").get("href").split("/")
    gid = int(urlSplit[-3])
    token = urlSplit[-2]
    archiver_key = "ignored"
    title = soup.select_one("#gn").text
    title_jpn = soup.select_one("#gj").text
    category = soup.select_one("#gdc > div").text
    thumb = (
        soup.select_one("#gd1 > div")
        .get("style")
        .split("(")[1]
        .split(")")[0]
    )
    uploader = soup.select_one("#gdn").text
    posted = int(
        time.mktime(
            time.strptime(
                soup.select_one(
                    "#gdd > table > tr:nth-child(1) > td.gdt2"
                ).text,
                "%Y-%m-%d %H:%M",
            )
        )
    )+8*60*60
    filecount = soup.select_one(
        "#gdd > table > tr:nth-child(6) > td.gdt2 "
    ).text.split(" ")[0]

    fileSizeText, fileSizeUnit = soup.select_one(
        "#gdd > table > tr:nth-child(5) > td.gdt2"
    ).text.split(" ")
    filesize = int(
        float(fileSizeText)
        * {"KB": 1024, "MB": 1048576, "GB": 1073741824}[fileSizeUnit]
    )
    expunged = (
        soup.select_one(
            "#gdd > table > tr:nth-child(3) > td.gdt2 ").text
        != "Yes"
    )
    rating = soup.select_one("#rating_label").text.split(" ")[1]
    torrentcount = (
        soup.select_one("#gd5 > p:nth-child(3) > a")
        .text.split("(")[1]
        .split(")")[0]
    )
    torrents = []
    tags = []
    for row in soup.select("#taglist > table > tr"):
        rowName = row.select_one("td.tc").text
        tags.extend(
            [rowName + x.text for x in row.select("td > div > a")])

    favoriteText = soup.select_one("#favoritelink").text
    favorite = -1
    if favoriteText != " Add to Favorites":
        style = soup.select_one("#fav > div.i").get("style")
        position = style.split(
            "background-position:0px ")[1].split("px;")[0]
        favorite = ["-2", "-21", "-40", "-59", "-78", "-97",
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
            "favorite": favorite,  # -1:未收藏 0-9:收藏夹编号
        },
    }
    return g_data


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
    uploader = xml.xpath('//div[@id="gdn"]/a/text()')[0]

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
    rating = xml.xpath('//td[@id="rating_label"]/text()')[0].split(" ")[1]
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
            "favorite": favoriteState,  # -1:未收藏 0-9:收藏夹编号
        },
    }
    return g_data


# @printPerformance
def __getCommentsFromGalleryPage(html: str) -> List[object]:
    result = []
    for comment in BeautifulSoup(html, features="html.parser").select("div.c1"):
        score = comment.select("div.c5.nosel > span")
        if len(score) == 0:
            score = ""
        else:
            score = score[0].text
        raw_comment_text = str(comment.select_one("div.c6"))
        comment_text = raw_comment_text
        comment_text = comment_text.replace(
            "https://exhentai.org/g/", "/#/g/")
        comment_text = comment_text.replace(
            "https://exhentai.org/t/", "https://ehgt.org/t/"
        )
        comment_text = comment_text.replace(
            "<a href=", '<a target="_blank" href='
        )

        comment_short = comment.select_one("div.c6").text

        if len(comment_short) > 40:
            comment_short = comment_short[:40] + "..."
        poster = comment.select_one("div.c3 > a").text if comment.select_one(
            "div.c3 > a") != None else ""  # 评论者删号了？
        post_date = comment.select_one(
            "div.c3").text.split(" by: ")[0][10:]
        result.append(
            {
                "poster": poster,
                "post_date": post_date,
                "score": score,
                "html": comment_text,
                "short": comment_short,
            }
        )
    return result


# @printPerformance
def getCommentsFromGalleryPage(html: str) -> List[object]:
    result = []
    for comment in etree.HTML(html).xpath('//div[@class="c1"]'):
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
    return result


# @printPerformance
def getInfoFromViewingPage(html):
    skipHathKey = re.findall(r"onclick=\"return nl\('([^\)]+)'\)", html)
    if len(skipHathKey) != 0:
        skipHathKey = skipHathKey[0]
    else:
        skipHathKey = ""
    imgSrc = re.findall(r"<img id=\"img\" src=\"([^\"]+)\"", html)[0]
    return (skipHathKey, imgSrc)


@printPerformance
def getViewInfoFromPage(html):
    # preview = re.findall(r"src=\"https://exhentai.org/t/([^\"]+)\"", html)
    # href = re.findall(r"href=\"https://exhentai.org/s/([^\"]+)\"", html)
    # assert len(preview) <= len(href)#用正则href会识别到下面评论区的链接
    # return [
    #     (
    #         "https://exhentai.org/s/"+href[i],
    #         "https://ehgt.org/t/"+preview[i],
    #     ) for i in range(len(preview))
    # ]

    return [
        (
            elem.xpath("a/@href")[0],
            elem.xpath("a/img/@src")[0]
        )for elem in etree.HTML(html).xpath('//div[@class="gdtl"]')
    ]
