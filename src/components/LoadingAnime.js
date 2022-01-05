import { makeStyles } from '@mui/styles';

export default function LoadingAnime() {
    
    const useStyles = makeStyles((theme) => (
        {
            animeContainer: {
                width: "100%",
                height: "100%",
                "& > .loadanimespinner > div": {
                    backgroundColor: theme.palette.primary.main,
                }
            }
        }
    ))


    const classes = useStyles();



    return (
        <div className={classes.animeContainer}  >
            <div className="loadanimespinner">
                <div className="rect1"></div>
                <div className="rect2"></div>
                <div className="rect3"></div>
                <div className="rect4"></div>
                <div className="rect5"></div>
            </div>
        </div>
    )
}