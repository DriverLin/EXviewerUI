import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import GetTranslate from "../GetTranslate.js"



export default function TagPanel(props) {
    const ButtonType = styled(Button)(({ theme }) => ({
        color: theme.palette.button.tag.text,
        backgroundColor: theme.palette.button.tag.type.main,
        textTransform: "none",
        height: "32px",
        fontSize: "10pt",
        margin: "10px",
        marginLeft: 0,
        "&:hover": {
            background: theme.palette.button.tag.type.hover,
        },
    }));


    const ButtonValue = styled(Button)(({ theme }) => ({
        color: theme.palette.button.tag.text,
        backgroundColor: theme.palette.button.tag.value.main,
        textTransform: "none",
        height: "32px",
        fontSize: "10pt",
        margin: "10px",
        marginLeft: 0,
        "&:hover": {
            background: theme.palette.button.tag.value.hover,
        },
    }));

    return (<table>
        <tbody >
            {
                Object.keys(props.tags).map((row) => {
                    return (
                        <tr key={row}>
                            <td valign="top">
                                <ButtonType name='clickable' sx={{ width: "83px", }} >{
                                    GetTranslate("rows", row) + ":"
                                }</ButtonType>
                            </td>
                            <td>
                                {
                                    props.tags[row].map((value) => {
                                        return (
                                            <ButtonValue
                                                name='clickable'
                                                key={value}
                                                onClick={() => {
                                                    window.open(`/#/search?f_search=${encodeURIComponent(`${row}:"${value}$"`)}`, "_blank");
                                                }}
                                            >
                                                {
                                                    GetTranslate(row, value)
                                                }
                                            </ButtonValue>
                                        )
                                    })
                                }
                            </td>
                        </tr>
                    )
                })
            }
        </tbody>
    </table>)
}


// export default function TagPanel() {
//     return (
//         <TP tags={{

//             "type": ["V1", "V2", "V3"],
//             "groups": ["group1", "group2", "group3"],
//             "artist": ["ken", "Yuki"]
//         }} />
//     );
// }


