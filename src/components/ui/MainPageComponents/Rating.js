const starYellow = <svg
    focusable="false"
    aria-hidden="true"
    viewBox="0 0 24 24"
    data-testid="StarIcon"
    style={{
        width: 24,
        height: 24,
    }}
>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#faaf00"></path>
</svg>
const starBlack = <svg
    focusable="false"
    aria-hidden="true"
    viewBox="0 0 24 24"
    data-testid="StarIcon"
    style={{
        width: 24,
        height: 24,
    }}
>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#00000044"></path>
</svg>


const BackgroundStars = () => <div
    style={{
        width: 120,
        overflow: "hidden",
        position: "absolute",
        left: 0,
        top: 0,
    }}
>
    {starBlack}
    {starBlack}
    {starBlack}
    {starBlack}
    {starBlack}
</div>

const FrontStars = (props) => <div
    style={{
        width: props.value,
        overflow: "hidden",
        position: "absolute",
        left: 0,
        top: 0,
    }}
>
    <div style={{ width: 120, height: 24 }}>
        {starYellow}
        {starYellow}
        {starYellow}
        {starYellow}
        {starYellow}
    </div>
</div>



export default function Rating(props) {
    return <div style={{ width: 120, height: 24 }}>
        <BackgroundStars />
        <FrontStars value={120 - (props.max - Math.floor(props.value / props.precision) * props.precision) * 24} />
    </div>

}