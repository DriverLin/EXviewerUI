import Grid from '@mui/material/Grid';
import SkeImg from './SkeImg';

export default function MultImageShow(props) {
    const mapSrc = []
    let maxWidth = "100vw"
    if (props.srcs.length === 2) {
        maxWidth = "50vw"
        if (props.lr) {
            mapSrc.push(props.srcs[1])
            mapSrc.push(props.srcs[0])
        } else {
            mapSrc.push(props.srcs[0])
            mapSrc.push(props.srcs[1])
        }
    } else { 
        mapSrc.push(props.srcs[0])
    }

    return (
        <Grid
            sx={{
                width: "100vw",
                height: "100vh",
            } }
            container
            direction="row"
            justifyContent="center"
            alignItems="center"
        >
            {
                mapSrc.map((src, index) => { 
                    return <img style={{ maxHeight: "100vh", maxWidth: maxWidth }} src={src} />
                })
            }
        </Grid>

        
    )
}
