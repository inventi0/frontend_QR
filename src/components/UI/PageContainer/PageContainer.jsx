import React from "react";
import styles from "./PageContainer.module.scss";

export const PageContainer = ({ children }) => {
    return <div className={styles.pageContainer}>{children}</div>;
};
