import { CircularProgress } from '@mui/material';

export default function DownloadCircularProgress(props) {
    return (
        <div style={{
            height: props.small_matches ? 24 : 20,
            width: props.small_matches ? 24 : 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <CircularProgress
                size={props.small_matches ? "24px" : "20px"}
                thickness={5}
                sx={{
                    color: "button.iconFunction.process",
                }}
                variant="determinate"
                value={props.value}
            />
        </div>
    )
}