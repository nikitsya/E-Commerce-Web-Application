import React from "react"


export const Button = props => {
    // Shared clickable wrapper used by legacy forms for consistent button styles.
    return (
        <span tabIndex="0" className={props.className} onClick={(event) => {
            props.onClick(event)
        }}>
            {props.value}
        </span>
    )
}
