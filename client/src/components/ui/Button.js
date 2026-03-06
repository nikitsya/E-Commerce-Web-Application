import React from "react"


export const Button = props => {
    return (
        <span tabIndex="0" className={props.className} onClick={(event) => {
            props.onClick(event)
        }}>
            {props.value}
        </span>
    )
}