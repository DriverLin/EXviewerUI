import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import GetTranslate from "../../utils/GetTranslate.js";


const TypeContainer = styled(Button)(({ theme }) => ({
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


const ValueContainer = styled(Button)(({ theme }) => ({
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



/**
 * tag面板
 * @param {object} tags
 * @param {function} onClick
 */
export default function TagPanel({ tags, onClick }) {
    return (<table>
        <tbody >
            {
                Object.keys(tags).map((row) => (<tr key={row}>
                    <td valign="top">
                        <TypeContainer sx={{ width: "83px" }} >{
                            GetTranslate("rows", row) + ":"
                        }</TypeContainer>
                    </td>
                    <td>
                        {
                            tags[row].map((value) => (<ValueContainer
                                key={value}
                                onClick={() => {
                                    onClick(row, value)
                                }}
                            >
                                {
                                    GetTranslate(row, value)
                                }
                            </ValueContainer>))
                        }
                    </td>
                </tr>))
            }
        </tbody>
    </table>)
}


