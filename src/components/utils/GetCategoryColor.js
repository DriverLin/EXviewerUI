const colorMap = {
    "Manga": "#FF9700",
    "Doujinshi": "#F44236",
    "Non-H": "#9C28B1",
    "Cosplay": "#9C28B1",
    "Image Set": "#3F51B5",
    "Western": "#8BC24A",
    "Game CG": "#4CB050",
    "Misc": "#F06292",
    "Artist CG": "#9C28B1",
    "Private": "#000000",
};


const randomColor = () => { 
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

const getCategoryColor = (category) => {
    if (category in colorMap) {
        return colorMap[category];
    }else{
        return randomColor();
    }
}