import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { purple } from '@mui/material/colors';
import GetTranslate from "../GetTranslate.js"



export default function TagPanel(props) {
    const BootstrapButton = styled(Button)({
        color: "#ffffff",
        backgroundColor: "#4A4A4A",
        textTransform: "none",
        height: "32px",
        fontSize: "10pt",
        margin: "10px",
        marginLeft: 0,
        "&:hover": {
            background: "#646464",
        },
    });
    return (<table>
        <tbody >
            {
                Object.keys(props.tags).map((row) => {
                    return (
                        <tr key={row}>
                            <td valign="top"><BootstrapButton sx={{ width: "83px", }} >{
                                GetTranslate("rows",row)
                            }:</BootstrapButton></td>
                            <td>
                                {
                                    props.tags[row].map((value) => {
                                        return (
                                            <BootstrapButton
                                                key={value}
                                                onClick={() => {
                                                    window.open(`/search?f_search=${encodeURIComponent(`${row}:"${value}$"`)}`,"_blank");                  
                                                 }}
                                            >{
                                                    GetTranslate(row,value)
                                            }</BootstrapButton>
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
