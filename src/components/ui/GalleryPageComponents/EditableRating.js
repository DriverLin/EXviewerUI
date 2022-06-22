import { Rating } from "@mui/material";
import { useState } from "react";
import { rateGallery } from "../../api/serverApi";

export default function EditableRating({ defaultValue, precision, emptyIcon, size, gid, token, extended }) {
    
    const [value, setValue] = useState(extended && extended.userRankValue != -1 ? extended.userRankValue : defaultValue)
    
    const [color, setColor] = useState(extended ? extended.userRankColor : "")
    
    const [fetching, setFetching] = useState(false)
    const handelRatingValueSubmit = async (score) => {
        const old = Number(value)
        setValue(score)
        setFetching(true)
        const [result, error] = await rateGallery(gid, token, score)
        if (error) {
            setValue(old)
        } else {
            setColor(result["userRankColor"])
        }
        setFetching(false)
    }

    return <Rating
        value={value}
        precision={precision}
        emptyIcon={emptyIcon}
        size={size}
        onChange={(e, v) => handelRatingValueSubmit(v)}
        disabled={fetching}
        sx={{
            '& .MuiRating-iconFilled': {
                color: color,
            },
            '& .MuiRating-iconHover': {
                color: color,
            },
        }}
    />
}