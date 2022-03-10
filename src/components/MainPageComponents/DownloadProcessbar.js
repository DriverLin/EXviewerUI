import { CircularProgress } from '@mui/material';

export default function DownloadProcessbar(props) {
    return (
        <div style={{ height: props.small ? 20 : 24, width: props.small ? 20 : 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress
                size={props.small ? "20px" : "24px"}
                thickness={5}
                sx={{
                    color: "button.iconFunction.process",
                }}
                variant="determinate"
                value={props.process}
            />
        </div>
    )
}