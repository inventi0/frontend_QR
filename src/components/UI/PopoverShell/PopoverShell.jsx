import React from "react";
import { FaTimes } from "react-icons/fa";
import styles from "./PopoverShell.module.scss";

const PopoverShell = React.forwardRef(({ title, onClose, className, style, children }, ref) => {
    return (
        <div ref={ref} className={`${styles.shell} ${className || ""}`} style={style}>
            {(title || onClose) && (
                <div className={styles.header}>
                    <span className={styles.title}>{title || ""}</span>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose} title="Закрыть">
                            <FaTimes />
                        </button>
                    )}
                </div>
            )}
            {children}
        </div>
    );
});

export default PopoverShell;
