import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import GetTranslate from "../../utils/GetTranslate.js";




/**
 * tag面板
 * @param {object} props 
 * @param {object} props.tags
 * @param {function} props.onClick
 */
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
                                                    props.onClick(row, value)
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


