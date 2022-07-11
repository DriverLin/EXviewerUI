import { getStringHash } from "./tools";

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

const MaterialColors = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFEB3B',
    '#FFC107',
    '#FF9800',
    '#FF5722',
]



const randomColor = (str) => {
    return MaterialColors[  getStringHash(str) % MaterialColors.length ];
}

const getCategoryColor = (category) => {
    if (category in colorMap) {
        return colorMap[category];
    } else {
        return randomColor(category);
    }
}
export default getCategoryColor;